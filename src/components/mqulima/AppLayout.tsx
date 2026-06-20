import React, { type ReactNode, Suspense } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";

const CartDrawer = React.lazy(() =>
  import("../shop/CartDrawer").then((m) => ({ default: m.CartDrawer }))
);

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
    </div>
  );
}
