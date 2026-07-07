import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { AppShell } from "@/components/app-shell";
import { SectionCard, SectionTitle } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  PREMIUM_MONTHLY_PRICE_USD,
  PREMIUM_YEARLY_PRICE_USD,
  PREMIUM_YEARLY_EFFECTIVE_MONTHLY,
  PREMIUM_YEARLY_SAVINGS_PCT,
  PREMIUM_FEATURES,
  FREE_PLANT_LIMIT,
} from "@shared/pricing";
import type { SubscriptionTier } from "@shared/schema";

const REASON_COPY: Record<string, string> = {
  plant_limit: `You've reached the free plan's limit of ${FREE_PLANT_LIMIT} tracked plants. Upgrade to track your whole collection.`,
  progress_history: "Full growth-photo history is a Premium feature.",
  advanced_notifications: "Custom notification schedules are a Premium feature.",
};

export default function Upgrade() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Exclude<SubscriptionTier, "free">>("premium_yearly");

  const reason = new URLSearchParams(search).get("reason") ?? undefined;

  const upgradeMutation = useMutation({
    mutationFn: async (tier: Exclude<SubscriptionTier, "free">) => {
      const res = await apiRequest("POST", "/api/account/upgrade", { tier });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/account"] });
      toast({ title: "Welcome to Premium 🌿", description: "Unlimited plants and full features are unlocked." });
      navigate("/account");
    },
    onError: () => {
      toast({ title: "Upgrade failed", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <AppShell>
      <div className="text-center mb-2 pt-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-soft text-primary mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="font-display text-xl mb-1" data-testid="text-upgrade-title">
          Go Premium
        </h1>
        <p className="text-sm text-muted-foreground max-w-[32ch] mx-auto" data-testid="text-upgrade-reason">
          {reason && REASON_COPY[reason] ? REASON_COPY[reason] : "Unlock unlimited plants and the full Dirt & Leaf toolkit."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 my-5">
        <button
          onClick={() => setSelected("premium_monthly")}
          className={cn(
            "relative text-left p-4 rounded-2xl border-2 bg-card transition-colors",
            selected === "premium_monthly" ? "border-primary" : "border-card-border"
          )}
          data-testid="button-plan-monthly"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Monthly</div>
          <div className="font-display text-xl" data-testid="text-price-monthly">
            ${PREMIUM_MONTHLY_PRICE_USD.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">per month</div>
        </button>

        <button
          onClick={() => setSelected("premium_yearly")}
          className={cn(
            "relative text-left p-4 rounded-2xl border-2 bg-card transition-colors",
            selected === "premium_yearly" ? "border-primary" : "border-card-border"
          )}
          data-testid="button-plan-yearly"
        >
          <div
            className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider"
            data-testid="badge-best-value"
          >
            Best value
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Yearly</div>
          <div className="font-display text-xl" data-testid="text-price-yearly">
            ${PREMIUM_YEARLY_PRICE_USD.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            ${PREMIUM_YEARLY_EFFECTIVE_MONTHLY.toFixed(2)}/mo • Save {PREMIUM_YEARLY_SAVINGS_PCT}%
          </div>
        </button>
      </div>

      <SectionCard testId="card-premium-features">
        <SectionTitle title="What you get" />
        <div className="grid gap-2.5">
          {PREMIUM_FEATURES.map((feature) => (
            <div key={feature} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <Button
        className="rounded-full w-full mt-1"
        size="lg"
        onClick={() => upgradeMutation.mutate(selected)}
        disabled={upgradeMutation.isPending}
        data-testid="button-confirm-upgrade"
      >
        {upgradeMutation.isPending
          ? "Upgrading…"
          : `Upgrade — $${(selected === "premium_monthly" ? PREMIUM_MONTHLY_PRICE_USD : PREMIUM_YEARLY_PRICE_USD).toFixed(2)}${
              selected === "premium_monthly" ? "/mo" : "/yr"
            }`}
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-3 mb-2" data-testid="text-mock-payment-disclosure">
        Demo mode: this flips your plan instantly with no real charge. Real payment processing (Stripe on web, Apple/Google
        in-app purchase on native apps) will be wired in before launch.
      </p>
      <button
        onClick={() => navigate("/account")}
        className="block w-full text-center text-sm text-muted-foreground py-2"
        data-testid="button-upgrade-maybe-later"
      >
        Maybe later
      </button>
    </AppShell>
  );
}
