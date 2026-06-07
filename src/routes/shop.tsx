import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { products } from "@/lib/mqulima-data";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Agrovet Shop · Mqulima" },
      { name: "description", content: "317+ certified agrovet inputs — fertilizers, seeds, pesticides, livestock supplies and equipment. M-Pesa checkout, same-day delivery across Kenya." },
    ],
  }),
  component: Shop,
});

const categories = ["All", "Pesticides", "Fertilizers", "Seeds", "Livestock", "Equipment"];

function Shop() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [inStock, setInStock] = useState(false);

  const filtered = useMemo(() => products.filter((p) =>
    (cat === "All" || p.category === cat) &&
    (!inStock || p.stock > 0) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase()))
  ), [q, cat, inStock]);

  return (
    <AppLayout>
      <section className="bg-gradient-to-br from-forest to-primary py-16 text-forest-foreground">
        <div className="container-px mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Agrovet Shop</span>
          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">Quality inputs, fair prices.</h1>
          <p className="mt-2 max-w-xl text-forest-foreground/80">{products.length}+ products from trusted brands, delivered to your county.</p>

          <div className="mt-7 flex flex-col gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/95 px-4 py-3 text-foreground">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fertilizers, seeds, vet drugs..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            <label className="flex items-center gap-2 px-2 text-sm font-semibold">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 accent-gold" /> In stock only
            </label>
            <button className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-gold-foreground"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
          </div>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}>
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center text-muted-foreground">No products match your filters.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <article key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-accent">
                  <img src={p.image} alt={p.name} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {p.badge && <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-foreground">{p.badge}</span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{p.brand} · {p.category}</div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold text-foreground">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div>
                      <div className="text-base font-extrabold text-forest">KES {p.price.toLocaleString()}</div>
                      <div className="text-[11px] text-muted-foreground">per {p.unit}</div>
                    </div>
                    <button onClick={() => toast.success(`${p.name} added to cart`)} aria-label="Add to cart" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition hover:scale-110 hover:bg-primary-glow">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
