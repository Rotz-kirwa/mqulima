import { type ComponentType } from "react";
import { Users, Wheat, MapPin, Stethoscope, TrendingUp, Truck } from "lucide-react";

interface StatItem {
  icon: ComponentType<{ className?: string }>;
  value: string;
  label: string;
  iconColor: string;
}

const stats: StatItem[] = [
  { icon: Users, value: "5,000+", label: "Farmers Served", iconColor: "text-blue-600" },
  { icon: Wheat, value: "317",    label: "Products Available", iconColor: "text-emerald-600" },
  { icon: MapPin, value: "47+",    label: "Counties Reached", iconColor: "text-rose-500" },
  { icon: Stethoscope, value: "1,200+", label: "Consultations Done", iconColor: "text-sky-600" },
  { icon: TrendingUp, value: "38%",    label: "Avg. Yield Increase", iconColor: "text-green-600" },
  { icon: Truck, value: "94%",    label: "Same-Day Deliveries", iconColor: "text-orange-500" },
];

interface StatTileProps {
  icon: ComponentType<{ className?: string }>;
  value: string;
  label: string;
  iconColor: string;
}

const StatTile = ({ icon: Icon, value, label, iconColor }: StatTileProps) => (
  <div className="flex items-center gap-3 px-8 border-r border-white/20 min-w-max">
    <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-white font-bold text-xl leading-none">{value}</p>
      <p className="text-sky-100 text-[11px] uppercase tracking-widest mt-0.5 font-semibold">{label}</p>
    </div>
  </div>
);

export function StatsBar() {
  return (
    <section className="bg-sky-500 py-4 overflow-hidden w-full">
      <div className="flex w-max animate-ticker">
        {[...stats, ...stats, ...stats, ...stats].map((stat, i) => (
          <StatTile key={i} {...stat} />
        ))}
      </div>
    </section>
  );
}
