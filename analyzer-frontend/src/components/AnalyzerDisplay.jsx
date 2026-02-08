const AnalyzerDisplay = ({ summary, url }) => {
  // Parse markdown-like content for display
  const renderContent = (text) => {
    if (!text) return null;

    // Split by lines and process
    const lines = text.split("\n");
    const elements = [];
    let currentList = [];
    let listKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc list-inside mb-4 space-y-1 text-gray-700">
            {currentList.map((item, i) => (
              <li key={i} className="ml-2">{item}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Handle headers (## Header)
      if (trimmedLine.startsWith("## ")) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="text-xl font-bold text-indigo-700 mt-6 mb-3 flex items-center gap-2">
            {trimmedLine.replace("## ", "")}
          </h2>
        );
        return;
      }

      // Handle h3 headers (### Header)
      if (trimmedLine.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-semibold text-gray-800 mt-4 mb-2">
            {trimmedLine.replace("### ", "")}
          </h3>
        );
        return;
      }

      // Handle bullet points
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        currentList.push(trimmedLine.substring(2));
        return;
      }

      // Handle bold text and regular paragraphs
      flushList();
      const processedLine = trimmedLine
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');

      elements.push(
        <p
          key={`p-${index}`}
          className="text-gray-700 mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {url && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <span className="text-sm text-gray-500">Source: </span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all">
            {url}
          </a>
        </div>
      )}

      <div className="prose prose-indigo max-w-none">
        {renderContent(summary)}
      </div>
    </div>
  );
};

export default AnalyzerDisplay;
