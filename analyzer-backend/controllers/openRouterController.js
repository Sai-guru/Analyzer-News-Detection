import { OpenRouter } from "@openrouter/sdk";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

// Initialize OpenRouter client lazily to ensure env vars are loaded
let openrouter = null;
const getOpenRouterClient = () => {
  if (!openrouter) {
    openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return openrouter;
};

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
  const text = mainContent.textContent || mainContent.innerText || "";

  // Clean up whitespace
  return text.replace(/\s+/g, " ").trim();
};

// Fetch website content
const fetchWebsiteContent = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  clearTimeout(timeoutId);
  return response;
};

export const openController = async (req, res) => {
  try {
    const { url, text: inputText } = req.body;
    let text = "";
    let source = url || null;

    if (
      inputText &&
      typeof inputText === "string" &&
      inputText.trim().length > 0
    ) {
      text = inputText.trim();
      source = null; // Not a URL-based analysis
    } else {
      // Validate URL presence
      if (!url) {
        return res.status(400).json({
          error: "Input required",
          message: "Please provide a valid website URL or text to analyze",
        });
      }
      // Validate URL format
      if (!isValidURL(url)) {
        return res.status(400).json({
          error: "Invalid URL",
          message:
            "The provided URL is not valid or is blocked due to company security policies. Please provide a valid HTTP or HTTPS URL that is allowed by your organization.",
          reason: "URL validation failed or blocked by security policy",
        });
      }
      // Fetch website content
      const response = await fetchWebsiteContent(url);
      if (!response.ok) {
        return res.status(400).json({
          error: "Failed to fetch website",
          message: `Website returned status: ${response.status}`,
        });
      }
      const html = await response.text();
      text = extractTextContent(html);
      source = url;
    }

    // Validate extracted or provided content
    if (!text || text.length < 10) {
      return res.status(400).json({
        error: "Insufficient content",
        message:
          "Please enter at least 10 characters of meaningful text to analyze. For best results, provide a full news excerpt, article, or claim.",
      });
    }

    // Truncate very long content to avoid API limits
    const maxLength = 50000;
    const truncatedText =
      text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    // Set up SSE headers for streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const stream = await getOpenRouterClient().chat.send({
      model: "liquid/lfm-2.5-1.2b-instruct:free",
      messages: [
        {
          role: "system",
          content: `You are an AI-assisted news verification and claim analysis system.

        Your task is NOT to summarize.
        Your task is to analyze website content for factual claims and assess their reliability.

        Follow these steps strictly:
        1. Identify the main factual claims in the content.
        2. Analyze each claim using widely accepted public knowledge.
        3. Detect ambiguity, exaggeration, missing context, or misleading framing.
        4. Assign EXACTLY ONE verdict per claim.

        Rules:
        - Do NOT use absolute terms like "100% true" or "definitely false".
        - If evidence is unclear, choose "Unverified".
        - If wording is technically correct but lacks context, choose "Misleading Framing".
        - Be neutral and cautious.

        Always format your response as:

        ## 🧾 Claims Identified
        List each factual claim clearly.

        ## 🔍 Analysis
        Explain reasoning and context for each claim.

        ## 🏷️ Verdicts
        For each claim:
        - Verdict label
        - Confidence (Low / Medium / High)

        ---
        **Allowed verdicts (choose one only):**
        - Likely True
        - Unverified
        - Likely False
        - Misleading Framing
        `,
        },
        {
          role: "user",
          content: `Analyze the following ${source ? `website content from ${source}` : "text input"}.

Extract factual claims and evaluate their reliability according to the rules above.
Do NOT summarize or rewrite the article.

Content:
${truncatedText}`,
        },
      ],
      stream: true,
    });

    let fullSummary = "";

    // Stream the response chunks to the client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullSummary += content;
        // Send each chunk as SSE data
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }

    // Send final complete summary and end stream
    res.write(
      `data: ${JSON.stringify({ done: true, summary: fullSummary, url: source })}\n\n`,
    );
    res.end();
  } catch (error) {
    console.error("OpenRouter Summarization Error:", error);

    // Handle abort errors (timeout)
    if (error.name === "AbortError") {
      return res.status(408).json({
        error: "Request Timeout",
        message: "The website took too long to respond. Please try again.",
      });
    }

    // Handle network errors
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return res.status(400).json({
        error: "Network Error",
        message:
          "Could not connect to the website. The URL may be invalid, blocked, or restricted by company security policies. Please check the URL and try again.",
        reason: "URL unreachable or blocked by security policy",
      });
    }

    // Generic error response
    res.status(500).json({
      error: "Summarization Failed",
      message:
        error.message ||
        "An unexpected error occurred while summarizing the website",
    });
  }
};

// Non-streaming version (alternative endpoint)
export const openControllerNoStream = async (req, res) => {
  try {
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
    } else {
      // Validate URL presence
      if (!url) {
        return res.status(400).json({
          error: "Input required",
          message: "Please provide a valid website URL or text to analyze",
        });
      }
      // Validate URL format
      if (!isValidURL(url)) {
        return res.status(400).json({
          error: "Invalid URL",
          message: "Please provide a valid HTTP or HTTPS URL",
        });
      }
      // Fetch website content
      const response = await fetchWebsiteContent(url);
      if (!response.ok) {
        return res.status(400).json({
          error: "Failed to fetch website",
          message: `Website returned status: ${response.status}`,
        });
      }
      const html = await response.text();
      text = extractTextContent(html);
      source = url;
    }

    // Validate extracted or provided content
    if (!text || text.length < 50) {
      return res.status(400).json({
        error: "Insufficient content",
        message:
          "The input appears to have no readable content or is too short to analyze",
      });
    }

    // Truncate very long content to avoid API limits
    const maxLength = 50000;
    const truncatedText =
      text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    // Generate summary using OpenRouter SDK (non-streaming)
    const completion = await getOpenRouterClient().chat.send({
      model: "liquid/lfm-2.5-1.2b-thinking:free",
      messages: [
        {
          role: "system",
          content: `You are an AI-assisted news verification and claim analysis system.

        Your task is NOT to summarize.
        Your task is to analyze website content for factual claims and assess their reliability.

        Follow these steps strictly:
        1. Identify the main factual claims in the content.
        2. Analyze each claim using widely accepted public knowledge.
        3. Detect ambiguity, exaggeration, missing context, or misleading framing.
        4. Assign EXACTLY ONE verdict per claim.

        Rules:
        - Do NOT use absolute terms like "100% true" or "definitely false".
        - If evidence is unclear, choose "Unverified".
        - If wording is technically correct but lacks context, choose "Misleading Framing".
        - Be neutral and cautious.

        Always format your response as:

        ## 🧾 Claims Identified
        List each factual claim clearly.

        ## 🔍 Analysis
        Explain reasoning and context for each claim.

        ## 🏷️ Verdicts
        For each claim:
        - Verdict label
        - Confidence (Low / Medium / High)

        ---
        **Allowed verdicts (choose one only):**
        - Likely True
        - Unverified
        - Likely False
        - Misleading Framing
        `,
        },
        {
          role: "user",
          content: `Analyze the following ${source ? `website content from ${source}` : "text input"}.

Extract factual claims and evaluate their reliability.
Follow the verdict rules strictly.

Content:
${truncatedText}`,
        },
      ],
      stream: false,
    });

    const analysis =
      completion.choices[0]?.message?.content || "Unable to generate";

    res.json({
      url: source,
      analysis: analysis,
    });
  } catch (error) {
    console.error("OpenRouter Analysis Error:", error);

    if (error.name === "AbortError") {
      return res.status(408).json({
        error: "Request Timeout",
        message: "The website took too long to respond. Please try again.",
      });
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return res.status(400).json({
        error: "Network Error",
        message:
          "Could not connect to the website. Please check the URL and try again.",
      });
    }

    res.status(500).json({
      error: "Analysis Failed",
      message:
        error.message ||
        "An unexpected error occurred while analyzing the website",
    });
  }
};
