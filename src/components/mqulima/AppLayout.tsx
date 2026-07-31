import React, { type ReactNode, Suspense, useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";

const CartDrawer = React.lazy(() =>
  import("../shop/CartDrawer").then((m) => ({ default: m.CartDrawer }))
);

const FloatingAIChat = React.lazy(() =>
  import("./FloatingAIChat").then((m) => ({ default: m.FloatingAIChat }))
);

export function AppLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll to top automatically on route changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background" suppressHydrationWarning>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      {mounted && (
        <Suspense fallback={null}>
          <FloatingAIChat />
          <CartDrawer />
        </Suspense>
      )}
    </div>
  );
}
