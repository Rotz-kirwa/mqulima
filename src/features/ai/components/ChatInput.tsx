import React, { useRef, useEffect } from "react";
import { Send, Square, Paperclip, X } from "lucide-react";
import { Attachment } from "../types/ai.types";
import { VoiceInput } from "./VoiceInput";
import { toast } from "sonner";

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  isGenerating: boolean;
  isListening: boolean;
  onSendMessage: () => void;
  onStopGeneration: () => void;
  onToggleSpeechInput: () => void;
}

export const ChatInput: React.FC<Props> = ({
  prompt,
  setPrompt,
  attachments,
  setAttachments,
  isGenerating,
  isListening,
  onSendMessage,
  onStopGeneration,
  onToggleSpeechInput,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [prompt]);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size 5MB.`);
        continue;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type,
            size: file.size,
            base64: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 bg-[#0A110D]/90 backdrop-blur border-t border-[#1B3627]">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-[#1B3627] text-white/90 text-xs px-3 py-1.5 rounded-lg border border-white/10">
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button onClick={() => removeAttachment(idx)} className="hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-[#0C1510] border border-[#1B3627] rounded-2xl p-2 focus-within:border-[#4CAF50] transition-colors">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileAttach}
          multiple
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <VoiceInput
          isListening={isListening}
          onToggleSpeechInput={onToggleSpeechInput}
        />

        <textarea
          ref={textareaRef}
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Mqulima AI about crops, pests, market prices, or weather..."
          className="flex-1 bg-transparent text-xs text-white placeholder-white/40 outline-none resize-none py-2 px-1 max-h-40"
        />

        {isGenerating ? (
          <button
            type="button"
            onClick={onStopGeneration}
            className="p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
            title="Stop generation"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSendMessage}
            disabled={!prompt.trim() && attachments.length === 0}
            className="p-2.5 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#224f3b] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
