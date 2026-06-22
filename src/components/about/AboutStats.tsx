import React, { useEffect, useRef, useState } from "react";

interface AnimatedStatProps {
  value: number;
  label: string;
  subtext: string;
  prefix: string;
  suffix: string;
  isMillion?: boolean;
}

function AnimatedStat({ value, label, subtext, prefix, suffix, isMillion }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !animatedRef.current) {
        animatedRef.current = true;
        observer.disconnect();

        let startTime: number | null = null;
        const duration = 1800; // 1800ms

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          // Ease-out cubic: f(t) = 1 - (1-t)^3
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          setDisplayValue(easeProgress * value);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setDisplayValue(value);
          }
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.1 });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, [value]);

  const formatted = isMillion 
    ? `${prefix}${displayValue.toFixed(1)}M${suffix}`
    : `${prefix}${Math.floor(displayValue).toLocaleString()}${suffix}`;

  return (
    <div ref={elementRef} className="flex flex-col items-center p-6 text-center select-none">
      <div className="text-3xl md:text-4xl font-medium text-[#1a5c2f] tracking-tight">
        {formatted}
      </div>
      <div className="mt-2 text-xs font-bold uppercase tracking-wider text-[#0c2e17] leading-snug">
        {label}
      </div>
      <div className="mt-1 text-[10px] text-gray-400 font-medium">
        {subtext}
      </div>
    </div>
  );
}

export function AboutStats() {
  return (
    <section className="py-16 md:py-24 bg-[#f5f2ed] text-left border-t border-[#0c2e17]/5">
      <div className="mx-auto max-w-6xl px-6">
        
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a5c2f]">
            The impact so far
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium text-[#0c2e17] tracking-tight">
            Small numbers today. Big numbers tomorrow.
          </h2>
          <p className="mt-2 text-xs md:text-sm text-gray-500 leading-relaxed font-normal">
            We are early. We know it. But every farmer we serve makes the next one easier to reach.
          </p>
        </div>

        {/* 4-column Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-[#0c2e17]/10 bg-white rounded-3xl p-4 shadow-sm border border-black/[0.03]">
          
          <AnimatedStat
            value={2412}
            label="Farmers on platform"
            subtext="Across Kenya, Uganda & Tanzania"
            prefix=""
            suffix=""
          />

          <AnimatedStat
            value={4.2}
            label="Farmer earnings facilitated"
            subtext="Through the Mqulima marketplace"
            prefix="KSh "
            suffix=""
            isMillion={true}
          />

          <AnimatedStat
            value={38}
            label="Courses published"
            subtext="By 12 verified agricultural experts"
            prefix=""
            suffix=""
          />

          <AnimatedStat
            value={6}
            label="Counties reached"
            subtext="Murang'a, Kiambu, Nakuru, Meru, Kisumu, Mombasa"
            prefix=""
            suffix=""
          />

        </div>

      </div>
    </section>
  );
}
