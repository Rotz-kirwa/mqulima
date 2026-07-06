import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/shop/$productId")({
  component: RedirectToProductSlug,
});

function RedirectToProductSlug() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/shop/product/$slug", params: { slug: productId }, replace: true });
  }, [productId, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#2D6A4F] border-r-2" />
    </div>
  );
}
