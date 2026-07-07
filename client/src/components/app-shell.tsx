import { Link, useLocation } from "wouter";
import { Logo } from "./logo";
import { Camera, Sprout, ShoppingBag, User, Home as HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/scan", label: "Scan", icon: Camera },
  { href: "/plants", label: "Plants", icon: Sprout },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/account", label: "Account", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-dvh flex justify-center bg-background text-foreground">
      <div className="w-full max-w-[480px] min-h-dvh flex flex-col relative">
        <header
          className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/60 shrink-0"
          data-testid="header-topbar"
        >
          <Link href="/" className="flex items-center gap-3" data-testid="link-home-brand">
            <Logo className="w-9 h-9 text-primary shrink-0" />
            <div>
              <div className="font-display text-[1.3rem] tracking-[0.15em] uppercase leading-none">
                Dirt &amp; Leaf
              </div>
              <div className="text-xs text-muted-foreground mt-1">Houseplant care, simplified</div>
            </div>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4" data-testid="main-content">
          {children}
        </main>

        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] grid grid-cols-5 gap-1 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-border/60 bg-background/95 backdrop-blur"
          data-testid="nav-tabbar"
        >
          {TABS.map((tab) => {
            const active = location === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-2xl text-xs transition-colors",
                  active ? "bg-primary-soft text-primary font-medium" : "text-muted-foreground"
                )}
                data-testid={`link-tab-${tab.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 2} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
