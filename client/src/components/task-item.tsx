import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const TYPE_BADGE: Record<string, string> = {
  water: "bg-water text-water-foreground",
  feed: "bg-feed text-feed-foreground",
  light: "bg-light text-light-foreground",
  repot: "bg-primary-soft text-primary",
};

export function TaskItem({
  badge,
  title,
  subtitle,
  type = "repot",
  onClick,
  highlighted,
  testId,
}: {
  badge: string;
  title: string;
  subtitle: string;
  type?: "water" | "feed" | "light" | "repot";
  onClick?: () => void;
  highlighted?: boolean;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left grid grid-cols-[40px_1fr_auto] gap-3 items-center p-4 rounded-2xl border border-card-border bg-card hover-elevate",
        highlighted && "outline outline-1 outline-primary/40 bg-primary-soft/20"
      )}
      data-testid={testId}
    >
      <div className={cn("w-10 h-10 rounded-full grid place-items-center font-bold shrink-0", TYPE_BADGE[type])}>
        {badge}
      </div>
      <div className="min-w-0">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-sm text-muted-foreground truncate">{subtitle}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
