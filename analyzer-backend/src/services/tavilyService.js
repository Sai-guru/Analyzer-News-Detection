import { tavily } from "@tavily/core";

let tavilyClient = null;

const getClient = () => {
  if (!tavilyClient && process.env.TAVILY_API_KEY) {
    tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
  }
  return tavilyClient;
};

export const isTavilyConfigured = () => Boolean(process.env.TAVILY_API_KEY);

const withRetry = async (fn, { retries = 2, baseDelayMs = 500, label = "tavily" } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 200;
      console.warn(`[${label}] attempt ${attempt + 1} failed: ${error?.message}. Retrying in ${Math.round(delay)}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

const truncateQuery = (text, maxLength = 200) => {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
};

// ---------- extract: pull clean content from a URL ----------

/**
 * Uses Tavily's extract endpoint to pull clean, readable content from a URL.
 * Handles JS-rendered pages and bot-blocking far better than a raw fetch + jsdom.
 * Returns { text, rawContentAvailable } or null if extraction failed/returned nothing.
 */
export const extractFromUrl = async (url) => {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await withRetry(() => client.extract([url]), {
      retries: 2,
      baseDelayMs: 700,
      label: "tavily extract",
    });

    const result = response?.results?.[0];
    if (!result || !result.rawContent) return null;

    return {
      text: result.rawContent.replace(/\s+/g, " ").trim(),
      url: result.url || url,
    };
  } catch (error) {
    console.error("Tavily extract failed:", error?.message);
    return null;
  }
};

// ---------- search: live evidence for claim verification ----------

/**
 * Returns clean evidence items for the given text, or [] if search
 * isn't configured, the query is empty, or the search failed after retries.
 */
export const searchEvidence = async (text) => {
  const client = getClient();
  if (!client) return [];

  const query = truncateQuery(text);
  if (!query) return [];

  try {
    const response = await withRetry(
      () =>
        client.search(query, {
          topic: "news",
          searchDepth: "fast",
          maxResults: 5,
          includeRawContent: false,
        }),
      { retries: 2, baseDelayMs: 400, label: "tavily search" },
    );

    return (response?.results || []).map((r) => ({
      title: r.title || "Untitled",
      url: r.url || "",
      snippet: r.content || r.snippet || "",
      publishedDate: r.published_date || null,
    }));
  } catch (error) {
    console.error("Tavily search failed after retries:", error?.message);
    return [];
  }
};

export const formatEvidenceForPrompt = (evidence) => {
  if (!evidence || evidence.length === 0) return "(no live search evidence found)";

  return evidence
    .map((item, i) => {
      const dateLine = item.publishedDate ? `\n${item.publishedDate}` : "";
      return `${i + 1}. ${item.title}\n${item.snippet}\n${item.url}${dateLine}`;
    })
    .join("\n\n");
};