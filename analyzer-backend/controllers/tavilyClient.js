import { tavily } from "@tavily/core";

let tavilyClient = null;

export const getTavilyClient = () => {
  if (!tavilyClient && process.env.TAVILY_API_KEY) {
    tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
  }
  return tavilyClient;
};

export const buildSearchQuery = ({ text, source }) => {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (cleaned) return cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned;
  return source || "";
};

export const buildEvidenceBlock = ({ evidence }) => {
  if (!evidence || evidence.length === 0) return "(no live search evidence)";

  return evidence
    .map((item, index) => {
      const title = item.title || "Untitled";
      const snippet = item.content || item.snippet || "";
      const url = item.url || "";
      const date = item.published_date || "";
      return `${index + 1}. ${title}\n${snippet}\n${url}${date ? `\n${date}` : ""}`;
    })
    .join("\n\n");
};

export const searchTavily = async ({ text, source }) => {
  const client = getTavilyClient();
  if (!client) return [];

  const query = buildSearchQuery({ text, source });
  if (!query) return [];

  const response = await client.search(query, {
    topic: "news",
    searchDepth: "fast",
    maxResults: 3,
    includeRawContent: false,
  });

  return response?.results || [];
};

export const summarizeEvidence = (evidence) => {
  return (evidence || []).map(({ title, url, published_date }) => ({
    title,
    url,
    published_date,
  }));
};
