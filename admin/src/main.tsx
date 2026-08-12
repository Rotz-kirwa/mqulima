import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress noise from third-party browser extensions (e.g. chat.js, language detection, extension ports)
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = String(event.reason?.message || event.reason || "");
    if (
      reason.includes("Could not establish connection") ||
      reason.includes("Receiving end does not exist") ||
      reason.includes("unknown host") ||
      reason.includes("Language detection")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
