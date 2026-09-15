import { isTavilyConfigured, extractFromUrl, searchEvidence } from "../services/tavilyService.js";
import { fetchAndExtractLocally } from "../services/localExtractService.js";
import { verifyClaims } from "../services/openRouterService.js";

const truncate = (text, maxLength = 50000) =>
  text.length > maxLength ? text.slice(0, maxLength) + "..." : text;

const sendHandledError = (res, error) => {
  if (error?.name === "AbortError") {
    return res.status(408).json({ error: "Request Timeout", message: "The website took too long to respond." });
  }
  if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED") {
    return res.status(400).json({ error: "Network Error", message: "Could not connect to the website." });
  }
  const upstreamStatus = error?.statusCode || error?.status;
  if (upstreamStatus === 402) {
    return res.status(402).json({
      error: "Insufficient Credits",
      message: "The OpenRouter account has run out of credits for this model. Add credits or switch to a smaller model.",
    });
  }
  if (error?.status && error?.payload) {
    return res.status(error.status).json(error.payload);
  }
  return res.status(500).json({ error: "Analysis Failed", message: error?.message || "Unexpected error" });
};

// ---------- Step 1: get clean text, from raw input or a URL ----------

/**
 * Resolves the request into plain text to analyze.
 * For URLs: tries Tavily's extract first (handles JS rendering, bot-blocking),
 * falls back to a local fetch + jsdom pass if Tavily isn't configured or fails.
 */
const resolveInputText = async (req, { minLength }) => {
  const { url, text: inputText } = req.body;

  if (inputText && typeof inputText === "string" && inputText.trim().length > 0) {
    return { text: inputText.trim(), source: null };
  }

  if (!url) {
    throw Object.assign(new Error("Input required"), {
      status: 400,
      payload: { error: "Input required", message: "Please provide a valid website URL or text to analyze" },
    });
  }

  let text = null;

  if (isTavilyConfigured()) {
    const extracted = await extractFromUrl(url);
    if (extracted?.text) text = extracted.text;
  }

  if (!text) {
    // Fallback: local fetch + jsdom (also validates the URL and blocks unsafe hosts)
    text = await fetchAndExtractLocally(url);
  }

  if (!text || text.length < minLength) {
    throw Object.assign(new Error("Insufficient content"), {
      status: 400,
      payload: {
        error: "Insufficient content",
        message: `Please provide at least ${minLength} characters of meaningful text to analyze.`,
      },
    });
  }

  return { text, source: url };
};

// ---------- The pipeline: text/URL → extract → Tavily search → OpenRouter → response ----------

// Named `openController` to match the existing route wiring in routes/openRouterSumm.js
export const openController = async (req, res) => {
  try {
    // Step 1: get clean text (Tavily extract for URLs, jsdom as fallback)
    const { text, source } = await resolveInputText(req, { minLength: 10 });
    const truncatedText = truncate(text);

    // Step 2: live evidence from Tavily search
    const evidence = await searchEvidence(truncatedText);

    // Step 3: OpenRouter LLM call, validated structured output
    const { claims, analysis, verdicts } = await verifyClaims({
      source,
      text: truncatedText,
      evidence,
    });

    // Step 4: respond in the desired format
    return res.status(200).json({
      source,
      claims,
      analysis,
      verdicts,
      evidence: evidence.map(({ title, url, publishedDate }) => ({ title, url, publishedDate })),
    });
  } catch (error) {
    console.error("Analysis pipeline error:", error);
    return sendHandledError(res, error);
  }
};