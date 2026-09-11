import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Suppress noise from third-party browser extensions (e.g. chat.js, language detection, extension ports)
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = String(event.reason?.message || event.reason || "");
    if (
      reason.includes("Could not establish connection") ||
      reason.includes("Receiving end does not exist") ||
      reason.includes("unknown host") ||
      reason.includes("Language detection") ||
      reason.includes("contentscript")
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    defaultPreloadStaleTime: 30000,
  });

  return router;
};
