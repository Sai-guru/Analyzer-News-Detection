import { OpenRouter } from "@openrouter/sdk";
import { formatEvidenceForPrompt } from "./tavilyService.js";

let openrouter = null;

const getClient = () => {
  if (!openrouter) {
    openrouter = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
  }
  return openrouter;
};

export const MODEL = "nvidia/nemotron-3.5-lightning:free";

// Keep this comfortably under your OpenRouter balance. Claim verification
// output (a handful of short claims/analysis/verdicts) rarely needs more
// than a couple thousand tokens — 16000 was the SDK default, not a real need.
const MAX_OUTPUT_TOKENS = 4000;

const ALLOWED_VERDICTS = ["Likely True", "Unverified", "Likely False", "Misleading Framing"];

const SYSTEM_PROMPT = `
You are a structured claim verification engine.

You MUST respond with a single JSON object and nothing else.
No markdown. No code fences. No commentary before or after the JSON.

TASK:
1. Extract clear, distinct factual claims from the content.
2. For each claim, write a short, evidence-grounded analysis.
3. Assign EXACTLY ONE verdict per claim from:
   "Likely True" | "Unverified" | "Likely False" | "Misleading Framing"

Rules:
- Do not merge multiple claims into one.
- Do not invent evidence that wasn't given to you.
- If evidence is insufficient to confirm a claim, use "Unverified".
- The claims, analysis, and verdicts arrays MUST be the same length,
  and index i in each array must refer to the same claim.
- Keep each analysis entry to 1-2 sentences — be concise.
`;

const RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "claim_verification",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["claims", "analysis", "verdicts"],
      properties: {
        claims: { type: "array", items: { type: "string" } },
        analysis: { type: "array", items: { type: "string" } },
        verdicts: { type: "array", items: { type: "string", enum: ALLOWED_VERDICTS } },
      },
    },
  },
};

const buildUserPrompt = ({ source, text, evidence }) => {
  const hasEvidence = evidence.length > 0;
  return `Analyze the following ${source ? `website content from ${source}` : "text input"}.

Extract factual claims and evaluate their reliability according to the rules above.
${
  hasEvidence
    ? "Live search evidence is provided below — ground your verdicts in it."
    : "No live search evidence was found — be conservative and prefer 'Unverified' when you cannot confirm a claim."
}

Evidence from live search:
${formatEvidenceForPrompt(evidence)}

Content:
${text}`;
};

const validate = (parsed) => {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Model response was not a JSON object");
  }
  const { claims, analysis, verdicts } = parsed;

  if (!Array.isArray(claims) || !Array.isArray(analysis) || !Array.isArray(verdicts)) {
    throw new Error("Model response missing claims/analysis/verdicts arrays");
  }
  if (claims.length === 0) {
    throw new Error("Model returned zero claims");
  }
  if (claims.length !== analysis.length || claims.length !== verdicts.length) {
    throw new Error(
      `Arrays misaligned (claims=${claims.length}, analysis=${analysis.length}, verdicts=${verdicts.length})`,
    );
  }
  verdicts.forEach((v, i) => {
    if (!ALLOWED_VERDICTS.includes(v)) {
      throw new Error(`Invalid verdict "${v}" at index ${i}`);
    }
  });

  return { claims, analysis, verdicts };
};

const parseJson = (raw) => {
  const cleaned = String(raw || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
};

// 402 = billing/credits issue — retrying won't help, fail fast instead.
const isNonRetryable = (error) => {
  const status = error?.statusCode || error?.status;
  return status === 402 || status === 401 || status === 403;
};

const withRetry = async (fn, { retries = 2, baseDelayMs = 500 } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (isNonRetryable(error)) {
        console.error(`[openrouter] non-retryable error (status ${error?.statusCode || error?.status}), failing fast`);
        break;
      }

      if (attempt === retries) break;

      const delay = baseDelayMs * 2 ** attempt + Math.random() * 200;
      console.warn(`[openrouter] attempt ${attempt + 1} failed: ${error?.message}. Retrying in ${Math.round(delay)}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

/**
 * Sends content + evidence to the LLM and returns a validated,
 * index-aligned { claims, analysis, verdicts } object.
 * Retries on transient/malformed-output failures; fails fast on billing/auth errors.
 */
export const verifyClaims = async ({ source, text, evidence }) => {
  return withRetry(async () => {
    const completion = await getClient().chat.send({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt({ source, text, evidence }) },
      ],
      response_format: RESPONSE_SCHEMA,
      max_tokens: MAX_OUTPUT_TOKENS,
    });

    const raw = completion?.choices?.[0]?.message?.content;
    const parsed = parseJson(raw);
    return validate(parsed);
  });
};