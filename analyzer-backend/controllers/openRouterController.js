// import { OpenRouter } from "@openrouter/sdk";
// import fetch from "node-fetch";
// import { JSDOM } from "jsdom";

// // Initialize OpenRouter client lazily to ensure env vars are loaded
// let openrouter = null;
// const getOpenRouterClient = () => {
//   if (!openrouter) {
//     openrouter = new OpenRouter({
//       apiKey: process.env.OPENROUTER_API_KEY,
//     });
//   }
//   return openrouter;
// };

// // Validate URL helper
// const isValidURL = (url) => {
//   try {
//     const parsedUrl = new URL(url);
//     return ["http:", "https:"].includes(parsedUrl.protocol);
//   } catch {
//     return false;
//   }
// };

// // Extract text content from HTML
// const extractTextContent = (html) => {
//   const dom = new JSDOM(html);
//   const document = dom.window.document;

//   // Remove script, style, nav, header, footer elements
//   const unwantedElements = document.querySelectorAll(
//     "script, style, nav, header, footer, aside, [role='navigation'], [role='banner']",
//   );
//   unwantedElements.forEach((element) => element.remove());

//   // Get main content or body text
//   const mainContent =
//     document.querySelector("main, article, .content, .main, #content, #main") ||
//     document.body;
//   const text = mainContent.textContent || mainContent.innerText || "";

//   // Clean up whitespace
//   return text.replace(/\s+/g, " ").trim();
// };

// // Fetch website content
// const fetchWebsiteContent = async (url) => {
//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

//   const response = await fetch(url, {
//     signal: controller.signal,
//     headers: {
//       "User-Agent":
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//       Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
//     },
//   });

//   clearTimeout(timeoutId);
//   return response;
// };

// export const openController = async (req, res) => {
//   try {
//     const { url, text: inputText } = req.body;
//     let text = "";
//     let source = url || null;

//     if (
//       inputText &&
//       typeof inputText === "string" &&
//       inputText.trim().length > 0
//     ) {
//       text = inputText.trim();
//       source = null; // Not a URL-based analysis
//     } else {
//       // Validate URL presence
//       if (!url) {
//         return res.status(400).json({
//           error: "Input required",
//           message: "Please provide a valid website URL or text to analyze",
//         });
//       }
//       // Validate URL format
//       if (!isValidURL(url)) {
//         return res.status(400).json({
//           error: "Invalid URL",
//           message:
//             "The provided URL is not valid or is blocked due to company security policies. Please provide a valid HTTP or HTTPS URL that is allowed by your organization.",
//           reason: "URL validation failed or blocked by security policy",
//         });
//       }
//       // Fetch website content
//       const response = await fetchWebsiteContent(url);
//       if (!response.ok) {
//         return res.status(400).json({
//           error: "Failed to fetch website",
//           message: `Website returned status: ${response.status}`,
//         });
//       }
//       const html = await response.text();
//       text = extractTextContent(html);
//       source = url;
//     }

//     // Validate extracted or provided content
//     if (!text || text.length < 10) {
//       return res.status(400).json({
//         error: "Insufficient content",
//         message:
//           "Please enter at least 10 characters of meaningful text to analyze. For best results, provide a full news excerpt, article, or claim.",
//       });
//     }

//     // Truncate very long content to avoid API limits
//     const maxLength = 50000;
//     const truncatedText =
//       text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

//     // Set up SSE headers for streaming response
//     res.setHeader("Content-Type", "text/event-stream");
//     res.setHeader("Cache-Control", "no-cache");
//     res.setHeader("Connection", "keep-alive");
//     res.setHeader("Access-Control-Allow-Origin", "*");

//     const stream = await getOpenRouterClient().chat.send({
//       model: "liquid/lfm-2.5-1.2b-instruct:free",
//       messages: [
//         {
//           role: "system",
//           content: `You are an AI-assisted news verification and claim analysis system.

//         Your task is NOT to summarize.
//         Your task is to analyze website content for factual claims and assess their reliability.

//         Follow these steps strictly:
//         1. Identify the main factual claims in the content.
//         2. Analyze each claim using widely accepted public knowledge.
//         3. Detect ambiguity, exaggeration, missing context, or misleading framing.
//         4. Assign EXACTLY ONE verdict per claim.

//         Rules:
//         - Do NOT use absolute terms like "100% true" or "definitely false".
//         - If evidence is unclear, choose "Unverified".
//         - If wording is technically correct but lacks context, choose "Misleading Framing".
//         - Be neutral and cautious.

//         Always format your response as:

//         ## 🧾 Claims Identified
//         List each factual claim clearly.

//         ## 🔍 Analysis
//         Explain reasoning and context for each claim.

//         ## 🏷️ Verdicts
//         For each claim:
//         - Verdict label
//         - Confidence (Low / Medium / High)

//         ---
//         **Allowed verdicts (choose one only):**
//         - Likely True
//         - Unverified
//         - Likely False
//         - Misleading Framing
//         `,
//         },
//         {
//           role: "user",
//           content: `Analyze the following ${source ? `website content from ${source}` : "text input"}.

// Extract factual claims and evaluate their reliability according to the rules above.
// Do NOT summarize or rewrite the article.

// Content:
// ${truncatedText}`,
//         },
//       ],
//       stream: true,
//     });

//     let fullSummary = "";

//     // Stream the response chunks to the client
//     for await (const chunk of stream) {
//       const content = chunk.choices[0]?.delta?.content;
//       if (content) {
//         fullSummary += content;
//         // Send each chunk as SSE data
//         res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
//       }
//     }

//     // Send final complete summary and end stream
//     res.write(
//       `data: ${JSON.stringify({ done: true, summary: fullSummary, url: source })}\n\n`,
//     );
//     res.end();
//   } catch (error) {
//     console.error("OpenRouter Summarization Error:", error);

//     // Handle abort errors (timeout)
//     if (error.name === "AbortError") {
//       return res.status(408).json({
//         error: "Request Timeout",
//         message: "The website took too long to respond. Please try again.",
//       });
//     }

//     // Handle network errors
//     if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
//       return res.status(400).json({
//         error: "Network Error",
//         message:
//           "Could not connect to the website. The URL may be invalid, blocked, or restricted by company security policies. Please check the URL and try again.",
//         reason: "URL unreachable or blocked by security policy",
//       });
//     }

//     // Generic error response
//     res.status(500).json({
//       error: "Summarization Failed",
//       message:
//         error.message ||
//         "An unexpected error occurred while summarizing the website",
//     });
//   }
// };

// // Non-streaming version (alternative endpoint)
// export const openControllerNoStream = async (req, res) => {
//   try {
//     const { url, text: inputText } = req.body;
//     let text = "";
//     let source = url || null;

//     if (
//       inputText &&
//       typeof inputText === "string" &&
//       inputText.trim().length > 0
//     ) {
//       text = inputText.trim();
//       source = null;
//     } else {
//       // Validate URL presence
//       if (!url) {
//         return res.status(400).json({
//           error: "Input required",
//           message: "Please provide a valid website URL or text to analyze",
//         });
//       }
//       // Validate URL format
//       if (!isValidURL(url)) {
//         return res.status(400).json({
//           error: "Invalid URL",
//           message: "Please provide a valid HTTP or HTTPS URL",
//         });
//       }
//       // Fetch website content
//       const response = await fetchWebsiteContent(url);
//       if (!response.ok) {
//         return res.status(400).json({
//           error: "Failed to fetch website",
//           message: `Website returned status: ${response.status}`,
//         });
//       }
//       const html = await response.text();
//       text = extractTextContent(html);
//       source = url;
//     }

//     // Validate extracted or provided content
//     if (!text || text.length < 50) {
//       return res.status(400).json({
//         error: "Insufficient content",
//         message:
//           "The input appears to have no readable content or is too short to analyze",
//       });
//     }

//     // Truncate very long content to avoid API limits
//     const maxLength = 50000;
//     const truncatedText =
//       text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

//     // Generate summary using OpenRouter SDK (non-streaming)
//     const completion = await getOpenRouterClient().chat.send({
//       model: "liquid/lfm-2.5-1.2b-thinking:free",
//       messages: [
//         {
//           role: "system",
//           content: `You are an AI-assisted news verification and claim analysis system.

//         Your task is NOT to summarize.
//         Your task is to analyze website content for factual claims and assess their reliability.

//         Follow these steps strictly:
//         1. Identify the main factual claims in the content.
//         2. Analyze each claim using widely accepted public knowledge.
//         3. Detect ambiguity, exaggeration, missing context, or misleading framing.
//         4. Assign EXACTLY ONE verdict per claim.

//         Rules:
//         - Do NOT use absolute terms like "100% true" or "definitely false".
//         - If evidence is unclear, choose "Unverified".
//         - If wording is technically correct but lacks context, choose "Misleading Framing".
//         - Be neutral and cautious.

//         Always format your response as:

//         ## 🧾 Claims Identified
//         List each factual claim clearly.

//         ## 🔍 Analysis
//         Explain reasoning and context for each claim.

//         ## 🏷️ Verdicts
//         For each claim:
//         - Verdict label
//         - Confidence (Low / Medium / High)

//         ---
//         **Allowed verdicts (choose one only):**
//         - Likely True
//         - Unverified
//         - Likely False
//         - Misleading Framing
//         `,
//         },
//         {
//           role: "user",
//           content: `Analyze the following ${source ? `website content from ${source}` : "text input"}.

// Extract factual claims and evaluate their reliability.
// Follow the verdict rules strictly.

// Content:
// ${truncatedText}`,
//         },
//       ],
//       stream: false,
//     });

//     const analysis =
//       completion.choices[0]?.message?.content || "Unable to generate";

//     res.json({
//       url: source,
//       analysis: analysis,
//     });
//   } catch (error) {
//     console.error("OpenRouter Analysis Error:", error);

//     if (error.name === "AbortError") {
//       return res.status(408).json({
//         error: "Request Timeout",
//         message: "The website took too long to respond. Please try again.",
//       });
//     }

//     if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
//       return res.status(400).json({
//         error: "Network Error",
//         message:
//           "Could not connect to the website. Please check the URL and try again.",
//       });
//     }

//     res.status(500).json({
//       error: "Analysis Failed",
//       message:
//         error.message ||
//         "An unexpected error occurred while analyzing the website",
//     });
//   }
// };


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

const SYSTEM_PROMPT = `
You are a structured claim verification engine.

You MUST follow the output format EXACTLY.
If format is not followed, the response is invalid.

DO NOT summarize.
DO NOT add notes.
DO NOT add extra commentary.
DO NOT merge claims.
DO NOT skip confidence.

TASK:
1. Extract clear factual claims.
2. Number each claim.
3. Provide analysis for each claim separately.
4. Assign EXACTLY ONE verdict per claim.
5. Assign EXACTLY ONE confidence level per claim.

FORMAT STRICTLY:

## 🧾 Claims Identified
1. Claim text
2. Claim text
3. Claim text

## 🔍 Analysis
1. Analysis for claim 1
2. Analysis for claim 2
3. Analysis for claim 3

## 🏷️ Verdicts
1. Verdict: Likely True | Confidence: Medium
2. Verdict: Unverified | Confidence: Low
3. Verdict: Misleading Framing | Confidence: High

Allowed verdicts (choose only one per claim):
- Likely True
- Unverified
- Likely False
- Misleading Framing

Allowed confidence:
- Low
- Medium
- High
`;

const buildUserPrompt = ({ source, truncatedText, strictVerdictNote }) => {
  return `Analyze the following ${
    source ? `website content from ${source}` : "text input"
  }.

Extract factual claims and evaluate their reliability according to the rules above.
${strictVerdictNote ? "Follow the verdict rules strictly." : ""}
Do NOT summarize or rewrite the article.

Content:
${truncatedText}`;
};

const prepareContentFromRequest = async (req, { minLength }) => {
  const { url, text: inputText } = req.body;

  let text = "";
  let source = url || null;

  if (inputText && typeof inputText === "string" && inputText.trim().length > 0) {
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
      model: "liquid/lfm-2.5-1.2b-instruct:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt({
            source,
            truncatedText,
            strictVerdictNote: false,
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

// Non-streaming version (alternative endpoint)
export const openControllerNoStream = async (req, res) => {
  try {
    const { text, source } = await prepareContentFromRequest(req, {
      minLength: 50,
    });

    const truncatedText = truncateForModel(text, 50000);

    const completion = await getOpenRouterClient().chat.send({
      model: "liquid/lfm-2.5-1.2b-thinking:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt({
            source,
            truncatedText,
            strictVerdictNote: true,
          }),
        },
      ],
      stream: false,
    });

    const analysis = completion?.choices?.[0]?.message?.content || "Unable to generate";

    return res.json({
      url: source,
      analysis,
    });
  } catch (error) {
    console.error("OpenRouter Analysis (NoStream) Error:", error);
    return sendHandledError(res, error, "Analysis Failed");
  }
};

