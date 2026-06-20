import { useEffect, useState, useRef } from "react";

const statsWithIcons = [
  { label: "Farmers Served", value: "5000+", icon: "👥" },
  { label: "Products Available", value: "317", icon: "🌾" },
  { label: "Counties Reached", value: "47+", icon: "📍" },
  { label: "Consultations Done", value: "1200+", icon: "🩺" },
  { label: "Avg. Yield Increase", value: "38%", icon: "📈" },
  { label: "Same-Day Deliveries", value: "94%", icon: "🚚" },
];

function CountUp({ value }: { value: string }) {
  const [count, setCount] = useState(0);
  const target = parseInt(value.replace(/\D/g, ""), 10) || 0;
  const suffix = value.replace(/[\d,]/g, ""); // extract characters like + or %
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let startTime: number | null = null;
          const duration = 1500; // 1.5 seconds

          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutQuad
            const easeProgress = progress * (2 - progress);
            const currentCount = Math.floor(easeProgress * target);

            setCount(currentCount);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={elementRef}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="bg-white border-y border-[#E8ECE9] py-8">
      <div className="container-px mx-auto max-w-7xl">
        {/* Responsive layout: scrollable list on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none md:grid md:grid-cols-3 lg:grid-cols-6 lg:pb-0">
          {statsWithIcons.map((s, idx) => (
            <div
              key={idx}
              className="flex w-[160px] shrink-0 flex-col items-center justify-center rounded-[12px] bg-[#FAFAF8] p-4.5 border border-[#E8ECE9] text-center md:w-auto shadow-sm transition hover:shadow-md hover:border-[#2D6A4F]/30"
            >
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <div className="font-sans text-xl font-black text-[#2D6A4F]">
                <CountUp value={s.value} />
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
