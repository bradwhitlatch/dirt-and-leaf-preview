import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export type TaskSheetData = {
  title: string;
  type: "water" | "feed" | "light" | "repot";
  plantName: string;
  meta: string;
  imageUrl?: string;
  steps: string[];
  cta?: { text: string; url: string };
};

const TYPE_STYLES: Record<TaskSheetData["type"], string> = {
  water: "bg-water text-water-foreground",
  feed: "bg-feed text-feed-foreground",
  light: "bg-light text-light-foreground",
  repot: "bg-primary-soft text-primary",
};

export function TaskSheet({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TaskSheetData | null;
}) {
  const [, navigate] = useLocation();
  if (!data) return null;

  const isInternal = data.cta ? data.cta.url.startsWith("/#/") || data.cta.url.startsWith("/") : false;

  function handleCtaClick(e: React.MouseEvent) {
    if (isInternal && data?.cta) {
      e.preventDefault();
      onOpenChange(false);
      const path = data.cta.url.replace(/^\/#/, "");
      navigate(path || "/");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[82%] overflow-y-auto" data-testid="sheet-task">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl" data-testid="text-sheet-title">
            {data.title}
          </SheetTitle>
        </SheetHeader>

        <div
          className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mt-3 mb-4",
            TYPE_STYLES[data.type]
          )}
          data-testid="badge-task-type"
        >
          {data.type}
        </div>

        <div className="flex items-center gap-3 mb-4">
          {data.imageUrl && (
            <img
              src={data.imageUrl}
              alt={data.plantName}
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
              data-testid="img-sheet-plant"
            />
          )}
          <div>
            <div className="font-semibold" data-testid="text-sheet-plant">
              {data.plantName}
            </div>
            <div className="text-sm text-muted-foreground" data-testid="text-sheet-meta">
              {data.meta}
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 mb-4">
          {data.steps.map((step, i) => (
            <div
              key={i}
              className="px-4 py-3 rounded-2xl bg-surface-2 border border-border text-sm"
              data-testid={`text-sheet-step-${i}`}
            >
              {step}
            </div>
          ))}
        </div>

        {data.cta && (
          <Button asChild className="rounded-full" data-testid="link-sheet-cta">
            <a
              href={data.cta.url}
              onClick={handleCtaClick}
              target={isInternal ? undefined : "_blank"}
              rel={isInternal ? undefined : "noopener noreferrer"}
            >
              {data.cta.text}
            </a>
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
