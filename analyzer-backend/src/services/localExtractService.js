import fetch from "node-fetch";
import dns from "node:dns/promises";
import net from "node:net";
import { JSDOM } from "jsdom";

const isValidURL = (url) => {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

const PRIVATE_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

const isPrivateIp = (ip) => {
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127 || (a === 169 && b === 254);
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
  }
  return false;
};

/**
 * Validates a URL is http(s) and does not resolve to a private/loopback address.
 * Throws a request-shaped error ({status, payload}) if unsafe.
 */
export const assertSafeUrl = async (url) => {
  if (!isValidURL(url)) {
    throw Object.assign(new Error("Invalid URL"), {
      status: 400,
      payload: { error: "Invalid URL", message: "Please provide a valid HTTP or HTTPS URL." },
    });
  }

  const { hostname } = new URL(url);
  if (PRIVATE_HOSTNAMES.has(hostname.toLowerCase())) {
    throw Object.assign(new Error("Blocked host"), {
      status: 400,
      payload: { error: "Invalid URL", message: "This URL points to a restricted host." },
    });
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    if (records.some((r) => isPrivateIp(r.address))) {
      throw Object.assign(new Error("Blocked host"), {
        status: 400,
        payload: { error: "Invalid URL", message: "This URL resolves to a restricted network address." },
      });
    }
  } catch (err) {
    if (err?.status) throw err;
    // DNS resolution failure — let the fetch itself surface a clearer network error.
  }
};

const extractTextFromHtml = (html) => {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  document
    .querySelectorAll("script, style, nav, header, footer, aside, [role='navigation'], [role='banner']")
    .forEach((el) => el.remove());

  const mainContent =
    document.querySelector("main, article, .content, .main, #content, #main") || document.body;

  return (mainContent?.textContent || "").replace(/\s+/g, " ").trim();
};

/**
 * Fetches a URL and extracts readable text via jsdom.
 * This is a fallback path only — it cannot execute JavaScript, so
 * client-rendered pages may come back empty or incomplete.
 * Prefer tavilyService.extractFromUrl when available.
 */
export const fetchAndExtractLocally = async (url) => {
  await assertSafeUrl(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw Object.assign(new Error("Failed to fetch website"), {
        status: 400,
        payload: { error: "Failed to fetch website", message: `Website returned status: ${response.status}` },
      });
    }

    const html = await response.text();
    return extractTextFromHtml(html);
  } finally {
    clearTimeout(timeoutId);
  }
};