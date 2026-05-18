import { OpenRouter } from "@openrouter/sdk";
import { buildEvidenceBlock } from "./tavilyClient.js";

let openrouter = null;

export const getOpenRouterClient = () => {
  if (!openrouter) {
    openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  return openrouter;
};

export const SYSTEM_PROMPT = `
You are a structured claim verification engine.

You MUST follow the output format EXACTLY.
If format is not followed, the response is invalid.

DO NOT summarize.
DO NOT add notes.
DO NOT add extra commentary.
DO NOT merge claims.

TASK:
1. Extract clear factual claims.
2. Number each claim.
3. Provide analysis for each claim separately.
4. Assign EXACTLY ONE verdict per claim.

FORMAT STRICTLY:

## \ud83e\uddfE Claims Identified
1. Claim text
2. Claim text
3. Claim text

## \ud83d\udd0d Analysis
1. Analysis for claim 1
2. Analysis for claim 2
3. Analysis for claim 3

## \ud83c\udff7\ufe0f Verdicts
1. Verdict: Likely True
2. Verdict: Unverified
3. Verdict: Misleading Framing

Allowed verdicts (choose only one per claim):
- Likely True
- Unverified
- Likely False
- Misleading Framing
`;

// export const STREAMING_MODEL = "deepseek/deepseek-r1";
export const STREAMING_MODEL = "liquid/lfm-2.5-1.2b-instruct:free";

export const buildUserPrompt = ({
  source,
  truncatedText,
  strictVerdictNote,
  evidence,
}) => {
  return `Analyze the following ${
    source ? `website content from ${source}` : "text input"
  }.

Extract factual claims and evaluate their reliability according to the rules above.
${strictVerdictNote ? "Follow the verdict rules strictly." : ""}
Do NOT summarize or rewrite the article.

Evidence from live search (if any):
${buildEvidenceBlock({ evidence })}

Content:
${truncatedText}`;
};
