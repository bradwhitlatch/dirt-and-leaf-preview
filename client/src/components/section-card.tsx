import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  children,
  className,
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      className={cn("bg-card border border-card-border rounded-3xl p-4 shadow-sm mb-4", className)}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-3 mb-3">
      <h2 className="font-display text-xl">{title}</h2>
      {eyebrow && <span className="text-xs text-muted-foreground">{eyebrow}</span>}
      {action}
    </div>
  );
}

export function Hero({
  imageUrl,
  title,
  subtitle,
  heightClass = "h-[220px]",
}: {
  imageUrl: string;
  title: string;
  subtitle: string;
  heightClass?: string;
}) {
  return (
    <div className={cn("relative rounded-3xl overflow-hidden mb-4 bg-surface-2", heightClass)} data-testid="hero-banner">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/55 to-transparent text-white">
        <div className="font-display text-2xl" data-testid="text-hero-title">{title}</div>
        <div className="text-sm opacity-90 max-w-[28ch]" data-testid="text-hero-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}
