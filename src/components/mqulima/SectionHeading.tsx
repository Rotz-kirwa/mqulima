import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  center?: boolean;
}) {
  return (
    <div
      className={`mb-10 flex flex-col gap-4 md:mb-12 ${center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}
    >
      <div className={center ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {eyebrow}
          </span>
        )}
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-forest md:text-4xl lg:text-5xl">
          {title}
        </h2>
        {subtitle && <p className="mt-3 text-base text-muted-foreground md:text-lg">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
