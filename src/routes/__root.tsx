import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useState, lazy, Suspense } from "react";
import { WifiOff } from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { generateCsrfToken } from "@/lib/csrf.server";

import appCss from "../styles.css?url";
const Toaster = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));
const PWAInstallBanner = lazy(() =>
  import("@/components/mqulima/PWAInstallBanner").then((m) => ({ default: m.PWAInstallBanner }))
);
const AnalyticsConsentBanner = lazy(() =>
  import("@/components/events/ConsentBanner").then((m) => ({ default: m.ConsentBanner }))
);
const AnalyticsRouteTracker = lazy(() =>
  import("@/components/events/RouteViewObserver").then((m) => ({ default: m.RouteViewObserver }))
);
import { usePWA } from "@/hooks/usePWA";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart-context";
import { TopProgressBar } from "@/components/mqulima/TopProgressBar";

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
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "Mqulima — Agriculture for the Future" },
      {
        name: "description",
        content: "Mqulima connects you to the knowledge, products, services and people you need to succeed — all in one place.",
      },
      { property: "og:site_name", content: "Mqulima" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Mqulima — Agriculture for the Future" },
      {
        property: "og:description",
        content: "Whatever your role in agriculture and wherever you sit in the chain, Mqulima connects you to the knowledge, products, services and people you need to succeed — all in one place.",
      },
      { property: "og:image", content: "https://mqulima.com/mqulima-logo.png" },
      { property: "og:image:width", content: "512" },
      { property: "og:image:height", content: "512" },
      { property: "og:image:alt", content: "Official Mqulima Brand Logo" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Mqulima — Agriculture for the Future" },
      {
        name: "twitter:description",
        content: "Whatever your role in agriculture and wherever you sit in the chain, Mqulima connects you to the knowledge, products, services and people you need to succeed — all in one place.",
      },
      { name: "twitter:image", content: "https://mqulima.com/mqulima-logo.png" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Mqulima" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=4" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico?v=4" },
      { rel: "shortcut icon", href: "/favicon.ico?v=4" },
      { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png?v=4" },
      { rel: "icon", type: "image/png", sizes: "48x48", href: "/favicon-48x48.png?v=4" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png?v=4" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png?v=4" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=4" },
      { rel: "manifest", href: "/manifest.webmanifest?v=4" },
      // PERF: do not preload fonts that no @font-face uses (wasted high-priority download).
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
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window==='undefined')return;function isNoise(m){if(!m)return false;var s=String(m);return s.includes('unknown host')||s.includes('contentscript')||s.includes('Could not establish connection')||s.includes('Receiving end does not exist')||s.includes('AI chart')||s.includes('chat.js');}window.addEventListener('unhandledrejection',function(e){var r=(e&&e.reason&&(e.reason.message||e.reason))||'';if(isNoise(r)){e.preventDefault();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();}},true);window.addEventListener('error',function(e){var m=(e&&(e.message||(e.error&&e.error.message)))||'';if(isNoise(m)){e.preventDefault();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();}},true);try{var oe=console.error,ow=console.warn;console.error=function(){var a=Array.prototype.slice.call(arguments).join(' ');if(isNoise(a))return;oe.apply(console,arguments);};console.warn=function(){var a=Array.prototype.slice.call(arguments).join(' ');if(isNoise(a))return;ow.apply(console,arguments);};}catch(_){}})();`,
          }}
        />
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
          <div className="flex min-h-screen flex-col w-full max-w-full overflow-x-hidden" suppressHydrationWarning>
            <TopProgressBar />
            {mounted && !isOnline && (
              <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-destructive py-2.5 px-4 text-center text-xs font-semibold text-destructive-foreground animate-pulse shadow-md">
                <WifiOff className="h-4 w-4" />
                <span>You are currently offline. Pages you've visited are available offline.</span>
              </div>
            )}
            <Outlet />
            {mounted && (
              <Suspense fallback={null}>
                <AnalyticsRouteTracker />
                <AnalyticsConsentBanner />
                <Toaster richColors position="top-right" />
                <PWAInstallBanner />
              </Suspense>
            )}
          </div>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
