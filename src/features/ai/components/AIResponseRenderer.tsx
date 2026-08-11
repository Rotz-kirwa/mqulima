import React from "react";
import { Volume2, VolumeX } from "lucide-react";

interface Props {
  content: string;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
}

export const AIResponseRenderer: React.FC<Props> = ({
  content,
  isSpeaking,
  onToggleSpeech
}) => {
  // Simple markdown renderer for code blocks, bold text, lists, and tables
  const renderFormattedContent = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      // Bold handling
      let formattedLine: React.ReactNode = line;
      if (line.includes("**")) {
        const parts = line.split("**");
        formattedLine = parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="text-[#4CAF50] font-semibold">{part}</strong> : part
        );
      }

      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-base font-bold text-[#4CAF50] mt-3 mb-1">{line.replace("### ", "")}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="text-lg font-bold text-emerald-400 mt-4 mb-2">{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="text-xl font-extrabold text-emerald-300 mt-4 mb-2">{line.replace("# ", "")}</h1>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-white/90 my-0.5">
            {formattedLine}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-white/90 leading-relaxed my-1">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className="relative group">
      <div className="pr-8 space-y-1">
        {renderFormattedContent(content)}
      </div>

      <button
        onClick={onToggleSpeech}
        title={isSpeaking ? "Stop Speaking" : "Listen to Response"}
        className="absolute top-0 right-0 p-1 rounded-md text-white/40 hover:text-emerald-400 hover:bg-white/5 transition-colors"
      >
        {isSpeaking ? <VolumeX className="h-3.5 w-3.5 text-amber-400 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
};
