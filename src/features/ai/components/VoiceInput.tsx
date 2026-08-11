import React from "react";
import { Mic, MicOff } from "lucide-react";

interface Props {
  isListening: boolean;
  onToggleSpeechInput: () => void;
}

export const VoiceInput: React.FC<Props> = ({
  isListening,
  onToggleSpeechInput,
}) => {
  return (
    <button
      type="button"
      onClick={onToggleSpeechInput}
      title={isListening ? "Stop listening" : "Voice input"}
      className={`p-2 rounded-xl border transition-all ${
        isListening
          ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
          : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
      }`}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
};
