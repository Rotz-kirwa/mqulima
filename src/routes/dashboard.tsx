import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Calendar, Heart, Bell, Award, TrendingUp, MapPin, Download, Wifi, WifiOff, Settings } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { usePWA } from "@/hooks/usePWA";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard · Mqulima" },
      { name: "description", content: "Track orders, manage bookings and view personalized recommendations for your farm." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const {
    isOnline,
    isInstallable,
    isInstalled,
    triggerInstall,
    notificationPermission,
    requestNotificationPermission,
  } = usePWA();

  const [channels, setChannels] = useState({
    sowing: true,
    market: false,
    weather: true,
  });

  const handleToggleChannel = async (key: "sowing" | "market" | "weather", value: boolean) => {
    if (value && notificationPermission !== "granted") {
      const result = await requestNotificationPermission();
      if (result !== "granted") {
        return; // Don't turn on if permission denied
      }
    }
    setChannels((prev) => ({ ...prev, [key]: value }));
    if (value) {
      toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} alerts enabled!`);
    } else {
      toast.info(`${key.charAt(0).toUpperCase() + key.slice(1)} alerts disabled.`);
    }
  };

  return (
    <AppLayout>
      <section className="bg-gradient-to-br from-forest to-primary py-12 text-forest-foreground">
        <div className="container-px mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Welcome back</span>
              <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Karibu, John 👋</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-forest-foreground/80"><MapPin className="h-3.5 w-3.5" /> Kapseret, Uasin Gishu · 4 acres · Maize & Dairy</p>
            </div>
            <div className="flex gap-3">
              <Stat label="Loyalty points" value="2,340" icon={Award} />
              <Stat label="Yield this season" value="+38%" icon={TrendingUp} />
            </div>
          </div>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* PWA & Notification Center Card */}
          <Card title="PWA & Notification Center" icon={Settings} cta="App Settings" link="/dashboard">
            <div className="space-y-4">
              {/* Connection Status & Mode */}
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">System Status</div>
                  <div className="text-xs text-muted-foreground">
                    {isInstalled ? "Running as standalone app" : "Running in browser"}
                  </div>
                </div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  isOnline ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                }`}>
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-success" /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-destructive" /> Offline
                    </>
                  )}
                </div>
              </div>

              {/* Install Button if Installable */}
              {isInstallable && (
                <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-center">
                  <p className="text-xs font-medium text-foreground mb-3">
                    Install Mqulima on your device for fast, offline-capable access to your farm tools.
                  </p>
                  <button
                    onClick={triggerInstall}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-gold-foreground transition hover:bg-gold/80"
                  >
                    <Download className="h-3.5 w-3.5" /> Install App
                  </button>
                </div>
              )}

              {isInstalled && !isInstallable && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center text-xs font-medium text-primary">
                  ✓ Mqulima is installed on your device
                </div>
              )}

              {/* Simulated Notification Toggles */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Subscriptions</h4>
                
                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <div className="text-sm font-semibold text-foreground">Sowing Windows</div>
                    <div className="text-[11px] text-muted-foreground">Alerts for perfect planting times</div>
                  </div>
                  <Switch
                    checked={channels.sowing}
                    onCheckedChange={(checked) => handleToggleChannel("sowing", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <div className="text-sm font-semibold text-foreground">Market Rates</div>
                    <div className="text-[11px] text-muted-foreground">Daily updates for crop prices</div>
                  </div>
                  <Switch
                    checked={channels.market}
                    onCheckedChange={(checked) => handleToggleChannel("market", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <div className="text-sm font-semibold text-foreground">AI Weather Alerts</div>
                    <div className="text-[11px] text-muted-foreground">Extreme weather warning notifications</div>
                  </div>
                  <Switch
                    checked={channels.weather}
                    onCheckedChange={(checked) => handleToggleChannel("weather", checked)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="My Orders" icon={Package} cta="View all" link="/shop">
            {[
              { id: "ORD-2841", item: "Mavuno Fertilizer × 3", status: "Out for delivery", color: "bg-gold/20 text-gold-foreground" },
              { id: "ORD-2796", item: "DK Maize Seed × 2", status: "Delivered", color: "bg-success/15 text-success" },
              { id: "ORD-2755", item: "Knapsack Sprayer", status: "Delivered", color: "bg-success/15 text-success" },
            ].map((o) => (
              <Row key={o.id} title={o.item} sub={o.id} chip={o.status} chipClass={o.color} />
            ))}
          </Card>

          <Card title="Upcoming Bookings" icon={Calendar} cta="Book a service" link="/services">
            {[
              { id: "MQ-A91X", item: "Vet visit — Dairy cow", status: "Tomorrow, 10am", color: "bg-primary/15 text-primary" },
              { id: "MQ-B23K", item: "Soil testing — 2 acres", status: "Fri 14 Mar", color: "bg-primary/15 text-primary" },
            ].map((o) => <Row key={o.id} title={o.item} sub={o.id} chip={o.status} chipClass={o.color} />)}
          </Card>

          <Card title="Notifications" icon={Bell} cta="Mark all read" link="/dashboard">
            {[
              { title: "Rains expected by Wednesday", sub: "Ideal time to plant maize in Uasin Gishu" },
              { title: "10% off CAN fertilizer", sub: "Limited offer — ends Sunday" },
              { title: "Your soil report is ready", sub: "Click to view recommendations" },
            ].map((n, i) => <Row key={i} title={n.title} sub={n.sub} chip="" chipClass="" />)}
          </Card>

          <Card title="Saved Products" icon={Heart} cta="Browse shop" link="/shop">
            {[
              { id: "p1", name: "Mavuno Planting Fertilizer", price: 3450 },
              { id: "p7", name: "Sukari F1 Tomato Seed", price: 1850 },
            ].map((p) => <Row key={p.id} title={p.name} sub={`KES ${p.price.toLocaleString()}`} chip="Save 5%" chipClass="bg-gold/20 text-gold-foreground" />)}
          </Card>

          <Card title="Recommended For You" icon={TrendingUp} cta="View shop" link="/shop">
            {[
              { name: "CAN Top Dressing", reason: "Matches your maize crop stage" },
              { name: "Maclick Dewormer", reason: "Due for your dairy cows" },
              { name: "Layers Mash", reason: "Top pick in Uasin Gishu" },
            ].map((r, i) => <Row key={i} title={r.name} sub={r.reason} chip="" chipClass="" />)}
          </Card>

          <Card title="Farm Profile" icon={MapPin} cta="Edit profile" link="/dashboard">
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-muted-foreground">County</span><span className="font-semibold">Uasin Gishu</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Farm size</span><span className="font-semibold">4 acres</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Crops</span><span className="font-semibold">Maize, Beans</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Livestock</span><span className="font-semibold">3 dairy cows</span></li>
            </ul>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
      <Icon className="h-5 w-5 text-gold" />
      <div>
        <div className="text-lg font-extrabold text-gold">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-forest-foreground/70">{label}</div>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, cta, link, children }: { title: string; icon: any; cta: string; link: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-forest">{title}</h3>
        </div>
        <Link to={link} className="text-xs font-semibold text-blue hover:underline">{cta}</Link>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ title, sub, chip, chipClass }: { title: string; sub: string; chip: string; chipClass: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
      {chip && <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${chipClass}`}>{chip}</span>}
    </div>
  );
}
