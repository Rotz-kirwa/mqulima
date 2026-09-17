import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Route: /news
 * Redirects seamlessly to /blog (Mqulima News & Insights Desk)
 * Resolves 404 errors when visitors or administrators navigate to /news.
 */
export const Route = createFileRoute("/news")({
  beforeLoad: () => {
    throw redirect({ to: "/blog" });
  },
  component: () => null,
});
