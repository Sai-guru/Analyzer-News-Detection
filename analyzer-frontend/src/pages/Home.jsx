import WebsiteAnalyzer from "./WebsiteAnalyzer";
import { RefreshCw } from "lucide-react";
const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1a1124] via-[#2a183a] to-[#0e0a13]">
      <div className="relative flex flex-col md:flex-row gap-6 w-full max-w-6xl">
        {/* Refresh Button - top right, floating, glassmorphism style */}
        <button
          onClick={() => window.location.reload()}
          className="absolute top-0 right-0 mt-4 mr-4 z-20 bg-white/20 backdrop-blur-md hover:bg-violet-200/40 border border-violet-400 shadow-xl rounded-full p-3 transition flex items-center justify-center text-violet-400 text-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
          title="Refresh Page"
        >
          <RefreshCw size={24} className="text-violet-400" />
        </button>
        <div className="w-full">
          <WebsiteAnalyzer />
        </div>
      </div>
    </div>
  );
}

export default Home;
