import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import {
  getOpenRouterClient,
  STREAMING_MODEL,
  buildUserPrompt,
} from "../services/openRouterService.js";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";
import { searchTavily, summarizeEvidence } from "../services/tavilyService.js";

// Validate URL helper
const isValidURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

// Extract text content from HTML
const extractTextContent = (html) => {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove script, style, nav, header, footer elements
  const unwantedElements = document.querySelectorAll(
    "script, style, nav, header, footer, aside, [role='navigation'], [role='banner']",
  );
  unwantedElements.forEach((element) => element.remove());

  // Get main content or body text
  const mainContent =
    document.querySelector("main, article, .content, .main, #content, #main") ||
    document.body;

  const text = mainContent?.textContent || mainContent?.innerText || "";
  return text.replace(/\s+/g, " ").trim();
};

// Fetch website content
const fetchWebsiteContent = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

const prepareContentFromRequest = async (req, { minLength }) => {
  const { url, text: inputText } = req.body;

  let text = "";
  let source = url || null;

  if (
    inputText &&
    typeof inputText === "string" &&
    inputText.trim().length > 0
  ) {
    text = inputText.trim();
    source = null;
    return { text, source };
  }

  if (!url) {
    const err = new Error("Input required");
    err.status = 400;
    err.payload = {
      error: "Input required",
      message: "Please provide a valid website URL or text to analyze",
    };
    throw err;
  }

  if (!isValidURL(url)) {
    const err = new Error("Invalid URL");
    err.status = 400;
    err.payload = {
      error: "Invalid URL",
      message:
        "The provided URL is not valid or is blocked due to company security policies. Please provide a valid HTTP or HTTPS URL that is allowed by your organization.",
      reason: "URL validation failed or blocked by security policy",
    };
    throw err;
  }

  const response = await fetchWebsiteContent(url);

  if (!response.ok) {
    const err = new Error("Failed to fetch website");
    err.status = 400;
    err.payload = {
      error: "Failed to fetch website",
      message: `Website returned status: ${response.status}`,
    };
    throw err;
  }

  const html = await response.text();
  text = extractTextContent(html);
  source = url;

  if (!text || text.length < minLength) {
    const err = new Error("Insufficient content");
    err.status = 400;
    err.payload = {
      error: "Insufficient content",
      message: `Please enter at least ${minLength} characters of meaningful text to analyze. For best results, provide a full news excerpt, article, or claim.`,
    };
    throw err;
  }

  return { text, source };
};

const truncateForModel = (text, maxLength = 50000) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const sendHandledError = (res, error, fallbackLabel) => {
  // Handle abort errors (timeout)
  if (error?.name === "AbortError") {
    return res.status(408).json({
      error: "Request Timeout",
      message: "The website took too long to respond. Please try again.",
    });
  }

  // Handle network errors
  if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED") {
    return res.status(400).json({
      error: "Network Error",
      message:
        "Could not connect to the website. The URL may be invalid, blocked, or restricted by company security policies. Please check the URL and try again.",
      reason: "URL unreachable or blocked by security policy",
    });
  }

  // Custom thrown errors
  if (error?.status && error?.payload) {
    return res.status(error.status).json(error.payload);
  }

  // Generic error response
  return res.status(500).json({
    error: fallbackLabel,
    message: error?.message || "An unexpected error occurred",
  });
};

// Streaming version (SSE)
export const openController = async (req, res) => {
  let clientClosed = false;

  try {
    const { text, source } = await prepareContentFromRequest(req, {
      minLength: 10,
    });

    const truncatedText = truncateForModel(text, 50000);
    const evidence = await searchTavily({ text, source });
    const evidenceSummary = summarizeEvidence(evidence);

    // Set up SSE headers for streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // If supported by the server (express behind some proxies), this flushes headers immediately.
    if (typeof res.flushHeaders === "function") res.flushHeaders();

    // Stop streaming if client disconnects
    req.on("close", () => {
      clientClosed = true;
    });

    const stream = await getOpenRouterClient().chat.send({
      model: STREAMING_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt({
            source,
            truncatedText,
            strictVerdictNote: false,
            evidence,
          }),
        },
      ],
      stream: true,
    });

    let fullSummary = "";

    for await (const chunk of stream) {
      if (clientClosed) break;

      const content = chunk?.choices?.[0]?.delta?.content;
      if (content) {
        fullSummary += content;
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }

    if (!clientClosed) {
      res.write(
        `data: ${JSON.stringify({
          done: true,
          summary: fullSummary,
          url: source,
          evidenceCount: evidenceSummary.length,
          evidence: evidenceSummary,
        })}\n\n`,
      );
      res.end();
    }
  } catch (error) {
    console.error("OpenRouter Analysis (Streaming) Error:", error);

    // If headers already sent in SSE mode, best effort end.
    if (res.headersSent) {
      try {
        res.write(
          `data: ${JSON.stringify({
            done: true,
            error: "Streaming Failed",
            message: error?.message || "An unexpected error occurred",
          })}\n\n`,
        );
        res.end();
      } catch {
        // ignore
      }
      return;
    }

    return sendHandledError(res, error, "Streaming Failed");
  }
};
