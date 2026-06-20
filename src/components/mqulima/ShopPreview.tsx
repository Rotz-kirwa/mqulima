import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { products } from "@/lib/mqulima-data";
import { SectionHeading } from "./SectionHeading";

export function ShopPreview() {
  const featured = products.slice(0, 8);
  return (
    <section className="container-px mx-auto max-w-7xl py-20">
      <SectionHeading
        eyebrow="Agrovet Shop"
        title="Everything your farm needs."
        subtitle="317+ certified inputs, sourced from trusted Kenyan and global brands. M-Pesa checkout, same-day delivery."
        action={
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {featured.map((p) => (
          <article
            key={p.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-accent">
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {p.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-foreground">
                  {p.badge}
                </span>
              )}
              <span
                className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold ${p.stock > 50 ? "bg-success/15 text-success" : "bg-gold/15 text-gold-foreground"}`}
              >
                {p.stock > 50 ? "In stock" : `Only ${p.stock} left`}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {p.brand} · {p.category}
              </div>
              <h3 className="mt-1 line-clamp-2 text-sm font-bold text-foreground">{p.name}</h3>
              <div className="mt-auto flex items-end justify-between pt-3">
                <div>
                  <div className="text-base font-extrabold text-forest">
                    KES {p.price.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">per {p.unit}</div>
                </div>
                <button
                  onClick={() => toast.success(`${p.name} added to cart`)}
                  aria-label="Add to cart"
                  className="grid h-9 w-9 place-items-center rounded-full bg-gold text-gold-foreground shadow-gold/30 transition hover:scale-110 hover:brightness-105"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
