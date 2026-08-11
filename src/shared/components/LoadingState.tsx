import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading experience...",
  className = "min-h-[250px]",
}) => {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-2xl bg-white/5 p-8 text-center text-white/70 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
      <p className="mt-3 text-xs font-medium tracking-wide text-white/60">
        {message}
      </p>
    </div>
  );
};
