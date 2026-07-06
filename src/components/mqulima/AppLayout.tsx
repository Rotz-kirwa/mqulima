import React, { type ReactNode, Suspense } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { PartnerMarquee } from "./PartnerMarquee";
import { FloatingAIChat } from "./FloatingAIChat";

const CartDrawer = React.lazy(() =>
  import("../shop/CartDrawer").then((m) => ({ default: m.CartDrawer }))
);

export function AppLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <PartnerMarquee />
      <Footer />
      <FloatingAIChat />
      <WhatsAppButton />
      {mounted && (
        <Suspense fallback={null}>
          <CartDrawer />
        </Suspense>
      )}
    </div>
  );
}
