import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { generateCsrfToken } from "@/lib/csrf.server";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { usePWA } from "@/hooks/usePWA";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-4 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => router.invalidate()}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="rounded-full border border-border px-6 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mqulima Hub" },
      {
        name: "description",
        content: "Mqulima is a community-driven digital agriculture ecosystem...",
      },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { isOnline } = usePWA();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate CSRF token on app initialization
    const initCsrf = async () => {
      try {
        await generateCsrfToken();
      } catch (err) {
        console.error("Failed to generate CSRF token:", err);
      }
    };
    initCsrf();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col w-full">
            {!isOnline && (
              <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-destructive py-2.5 px-4 text-center text-xs font-semibold text-destructive-foreground animate-pulse shadow-md">
                <WifiOff className="h-4 w-4" />
                <span>You are currently offline. Pages you've visited are available offline.</span>
              </div>
            )}
            <Outlet />
            {mounted && <Toaster richColors position="top-right" />}
          </div>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
