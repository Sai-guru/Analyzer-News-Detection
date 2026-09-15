import { OpenRouter } from "@openrouter/sdk";
import { buildEvidenceBlock } from "./tavilyService.js";

let openrouter = null;

export const getOpenRouterClient = () => {
  if (!openrouter) {
    openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return openrouter;
};

export const STREAMING_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export const buildUserPrompt = ({ source, truncatedText, strictVerdictNote, evidence }) => {
  return `Analyze ONLY the claims found in the "Content" section below.

--- EVIDENCE (verification reference only — do NOT extract claims from this) ---
${buildEvidenceBlock({ evidence })}
--- END EVIDENCE ---

--- CONTENT (extract claims ONLY from here) ---
${truncatedText}
--- END CONTENT ---
`;
};
