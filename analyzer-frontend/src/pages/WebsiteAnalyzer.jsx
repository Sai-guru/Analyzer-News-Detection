import { useState } from "react";
import SummaryDisplay from "../components/AnalyzerDisplay";
import { Search } from "lucide-react";

const WebsiteAnalyzer = () => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [source, setSource] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAnalysis("");
    setIsStreaming(true);
    setSource("");

    try {
      // Only send fields that are non-empty
      const payload = {};
      if (url.trim()) payload.url = url.trim();
      if (text.trim()) payload.text = text.trim();
      if (!payload.url && !payload.text) {
        alert("Please enter a website URL or paste text to analyze.");
        setLoading(false);
        setIsStreaming(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/summarize/website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let alertMsg = errorData.message || "Error analyzing claims";
        if (errorData.reason) {
          alertMsg += "\nReason: " + errorData.reason;
        }
        throw new Error(alertMsg);
      }

      // Handle SSE streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedAnalysis = "";
      let detectedSource = payload.url || "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const lines = textChunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                accumulatedAnalysis += data.chunk;
                setAnalysis(accumulatedAnalysis);
              }
              if (data.done) {
                setIsStreaming(false);
                if (data.url !== undefined) {
                  detectedSource = data.url || "";
                  setSource(detectedSource);
                }
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
      setSource(detectedSource);
    } catch (err) {
      alert(err.message || "Error analyzing claims");
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1124] via-[#2a183a] to-[#0e0a13]">
      {/* Header */}
      <header className="w-full py-8 bg-white/5 backdrop-blur-md shadow-sm mb-8 border-b border-violet-900/20">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            {/* <img src="" alt="Logo" className="w-10 h-10 rounded-full shadow-lg border border-violet-200/40" /> */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-violet-100 tracking-tight drop-shadow">Claim Analyzer</h1>
          </div>
          <p className="text-violet-200/90 text-center max-w-2xl text-base md:text-lg">
            Instantly analyze news articles or claims for factual accuracy and reliability. Paste a link or text, and get verdicts powered by AI.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row max-w-5xl mx-auto w-full gap-8 px-4">
        {/* Input Card */}
        <section className="md:w-1/2 w-full mb-8 md:mb-0">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-violet-200/30">
            <h2 className="text-xl font-semibold text-violet-100 mb-4 flex items-center gap-2 drop-shadow">
              <Search size={22} className="text-violet-200/80" />
              Analyze a Claim
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-violet-100 font-medium mb-1" htmlFor="url-input">Website URL</label>
                <input
                  id="url-input"
                  type="url"
                  placeholder="e.g. https://www.example.com/news"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-violet-200/40 bg-white/20 text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-violet-300"
                  autoComplete="off"
                />
              </div>
              <div className="flex items-center justify-center text-violet-200/70 text-sm font-medium gap-2">
                <span className="h-px w-8 bg-violet-200/40" />or<span className="h-px w-8 bg-violet-200/40" />
              </div>
              <div>
                <label className="block text-violet-100 font-medium mb-1" htmlFor="text-input">Paste News/Claim Text</label>
                <textarea
                  id="text-input"
                  placeholder="Paste the news article, excerpt, or claim here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={7}
                  className="w-full px-4 py-3 rounded-lg border border-violet-200/40 bg-white/20 text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y transition placeholder:text-violet-300"
                />
              </div>
              <button
                type="submit"
                className="mt-2 px-4 py-3 bg-gradient-to-r from-violet-600 via-purple-700 to-violet-500 text-white rounded-lg font-semibold shadow-xl hover:from-violet-700 hover:to-purple-800 transition disabled:opacity-60"
                disabled={loading}
              >
                {loading ? (isStreaming ? "Streaming..." : "Analyzing...") : "Analyze Claims"}
              </button>
              <div className="text-xs text-violet-200/80 mt-1">* You can enter either a website URL or paste text. Both are optional, but at least one is required.</div>
            </form>
          </div>
        </section>

        {/* Result Card */}
        <section className="md:w-1/2 w-full flex flex-col">
          {analysis ? (
            <div className="flex-1">
              <SummaryDisplay summary={analysis} url={source} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="text-violet-200/70 text-lg text-center select-none">
                <Search size={32} className="mx-auto mb-2 text-violet-200/80" />
                <div>Results will appear here after analysis.</div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-violet-200/60 text-xs mt-8">
        &copy; {new Date().getFullYear()} Claim Analyzer &mdash; AI-powered news & claim verification
      </footer>
    </div>
  );
};
export default WebsiteAnalyzer;
