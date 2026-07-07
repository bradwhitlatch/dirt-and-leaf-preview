import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { SectionCard, SectionTitle } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { subscribeToPush, isPushSupported } from "@/lib/push";
import { useState } from "react";
import { Crown, Bell, Sprout } from "lucide-react";
import type { SubscriptionTier } from "@shared/schema";

interface AccountInfo {
  id: number;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: number | null;
  subscriptionRenews: boolean;
  plantCount: number;
  freePlantLimit: number;
  canTrackAdditionalPlant: boolean;
  pricing: { monthly: number; yearly: number };
}

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  premium_monthly: "Premium (monthly)",
  premium_yearly: "Premium (yearly)",
};

export default function Account() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const { data: account, isLoading } = useQuery<AccountInfo>({ queryKey: ["/api/account"] });

  const downgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/account/downgrade");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/account"] });
      toast({ title: "Subscription cancelled", description: "You're back on the free plan." });
    },
  });

  async function handleEnablePush(checked: boolean) {
    if (!checked) {
      setPushEnabled(false);
      return;
    }
    if (!(await isPushSupported())) {
      toast({ title: "Push not supported", description: "Your browser doesn't support push notifications here.", variant: "destructive" });
      return;
    }
    setPushBusy(true);
    const result = await subscribeToPush();
    setPushBusy(false);
    if (result.ok) {
      setPushEnabled(true);
      toast({ title: "Notifications enabled", description: "You'll get a push when it's time to water or feed." });
    } else {
      toast({ title: "Couldn't enable notifications", description: result.reason ?? "Permission denied.", variant: "destructive" });
    }
  }

  const isPremium = account && account.subscriptionTier !== "free";

  return (
    <AppShell>
      <SectionTitle title="Account" />

      <SectionCard testId="card-plan-summary">
        <SectionTitle title="Plan" eyebrow={isPremium ? "Premium" : "Free"} />
        {isLoading || !account ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <div className="p-4 rounded-2xl border border-card-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              {isPremium && <Crown className="w-4 h-4 text-primary" />}
              <strong data-testid="text-current-plan">{TIER_LABEL[account.subscriptionTier]}</strong>
            </div>
            {isPremium ? (
              <span className="text-sm text-muted-foreground" data-testid="text-renewal-date">
                {account.subscriptionRenews ? "Renews" : "Expires"} on{" "}
                {account.subscriptionExpiresAt
                  ? new Date(account.subscriptionExpiresAt).toLocaleDateString()
                  : "—"}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground" data-testid="text-plant-usage">
                Tracking {account.plantCount} of {account.freePlantLimit} free plants
              </span>
            )}

            <div className="mt-3 flex gap-2">
              {!isPremium ? (
                <Link href="/upgrade">
                  <Button size="sm" className="rounded-full" data-testid="button-account-upgrade">
                    Upgrade to Premium
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => downgradeMutation.mutate()}
                  disabled={downgradeMutation.isPending}
                  data-testid="button-manage-subscription"
                >
                  {downgradeMutation.isPending ? "Cancelling…" : "Manage subscription"}
                </Button>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard testId="card-notifications">
        <SectionTitle title="Notifications" />
        <div className="flex items-center justify-between p-4 rounded-2xl border border-card-border bg-card">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-primary" />
            <div>
              <strong className="block text-sm">Push reminders</strong>
              <span className="text-xs text-muted-foreground">Water & feed alerts on this device</span>
            </div>
          </div>
          <Switch
            checked={pushEnabled}
            disabled={pushBusy}
            onCheckedChange={handleEnablePush}
            data-testid="switch-push-notifications"
          />
        </div>
        {!isPremium && (
          <Link
            href="/upgrade?reason=advanced_notifications"
            className="block mt-3 text-sm text-primary font-medium"
            data-testid="link-advanced-notifications"
          >
            Unlock custom schedules & snooze with Premium →
          </Link>
        )}
      </SectionCard>

      <SectionCard testId="card-affiliate-settings">
        <SectionTitle title="Shopping" />
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-card-border bg-card">
          <Sprout className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            Product recommendations use Amazon Associates links. See{" "}
            <Link href="/shop" className="text-primary font-medium underline">
              Shop
            </Link>{" "}
            for details.
          </span>
        </div>
      </SectionCard>
    </AppShell>
  );
}
