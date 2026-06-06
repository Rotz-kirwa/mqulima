import { Cloud, CloudRain, Sun, CloudSun, Wind } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const days = [
  { d: "Today", t: 24, icon: CloudSun, c: "Partly cloudy" },
  { d: "Tue", t: 22, icon: CloudRain, c: "Light rain" },
  { d: "Wed", t: 21, icon: CloudRain, c: "Showers" },
  { d: "Thu", t: 23, icon: Cloud, c: "Cloudy" },
  { d: "Fri", t: 26, icon: Sun, c: "Sunny" },
];

export function WeatherWidget() {
  return (
    <section className="bg-secondary/40 py-20">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Farm Intelligence"
          title="Weather & planting calendar."
          subtitle="County-level forecasts, seasonal alerts and a planting calendar matched to your crops."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Forecast */}
          <div className="rounded-3xl bg-gradient-to-br from-forest to-primary p-7 text-forest-foreground shadow-elegant lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-gold">5-day forecast</div>
                <div className="mt-1 text-3xl font-extrabold">Uasin Gishu County</div>
                <div className="mt-1 text-sm text-forest-foreground/70">Eldoret · Updated 12 min ago</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur">
                <div className="text-4xl font-extrabold">24°</div>
                <div className="text-xs text-forest-foreground/70">Feels 23°</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-5 gap-3">
              {days.map((d) => (
                <div key={d.d} className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gold">{d.d}</div>
                  <d.icon className="mx-auto my-2 h-7 w-7 text-forest-foreground" />
                  <div className="text-lg font-bold">{d.t}°</div>
                  <div className="mt-0.5 text-[10px] text-forest-foreground/70">{d.c}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-gold/15 p-3 text-xs text-gold ring-1 ring-gold/30">
              <Wind className="h-4 w-4" /> <span className="font-semibold">Seasonal alert:</span> Rains expected in Uasin Gishu by Wednesday — ideal time to plant maize.
            </div>
          </div>

          {/* Planting calendar */}
          <div className="rounded-3xl border border-border bg-card p-7 shadow-card">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Planting Calendar</div>
            <h3 className="mt-1 text-2xl font-extrabold text-forest">This Month: March</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                { crop: "Maize", action: "Plant", color: "bg-success" },
                { crop: "Beans", action: "Plant", color: "bg-success" },
                { crop: "Tomatoes", action: "Transplant", color: "bg-gold" },
                { crop: "Potatoes", action: "Top dress", color: "bg-primary" },
                { crop: "Cabbages", action: "Spray fungicide", color: "bg-destructive/80" },
              ].map((r) => (
                <li key={r.crop} className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
                  <span className="font-bold text-forest">{r.crop}</span>
                  <span className={`rounded-full ${r.color} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white`}>{r.action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
