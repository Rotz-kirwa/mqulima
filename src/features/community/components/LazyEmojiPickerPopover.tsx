import React from "react";

export interface LazyEmojiPickerPopoverProps {
  onSelect: (emoji: string) => void;
}

export default function LazyEmojiPickerPopover({ onSelect }: LazyEmojiPickerPopoverProps) {
  return (
    <div className="absolute bottom-20 left-4 bg-white border border-stone-200/90 rounded-2xl p-3 shadow-xl z-20 grid grid-cols-6 gap-2 text-xl animate-in fade-in zoom-in-95 duration-150">
      {["🌽", "🍅", "🥑", "🚜", "💧", "🌱", "🐄", "👍", "❤️", "🔥", "👏", "😊"].map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          className="hover:scale-125 transition p-1.5 hover:bg-emerald-50 rounded-xl cursor-pointer"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
