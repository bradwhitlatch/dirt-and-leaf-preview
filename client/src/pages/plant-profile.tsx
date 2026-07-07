import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Hero, SectionCard, SectionTitle } from "@/components/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fallbackPhotoFor } from "@/lib/stock-photos";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Camera as CameraIcon } from "lucide-react";
import type { Plant, Room, CareProfile, ProgressPhoto } from "@shared/schema";

interface AccountInfo {
  subscriptionTier: "free" | "premium_monthly" | "premium_yearly";
}

function formatDate(ts: number | null) {
  if (!ts) return "Not scheduled yet";
  const days = Math.round((ts - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Due now";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default function PlantProfile() {
  const params = useParams();
  const plantId = Number(params.id);

  const { data: plant, isLoading } = useQuery<Plant>({ queryKey: ["/api/plants", plantId] });
  const { data: rooms } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: careProfiles } = useQuery<CareProfile[]>({ queryKey: ["/api/care-profiles"] });
  const { data: account } = useQuery<AccountInfo>({ queryKey: ["/api/account"] });
  const { data: progressPhotos } = useQuery<ProgressPhoto[]>({
    queryKey: ["/api/plants", plantId, "progress-photos"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/plants/${plantId}/progress-photos`);
      return res.json();
    },
    enabled: !Number.isNaN(plantId),
  });

  const isPremium = account?.subscriptionTier && account.subscriptionTier !== "free";
  const room = plant?.roomId ? rooms?.find((r) => r.id === plant.roomId) : undefined;
  const careProfile = careProfiles?.find((c) => c.id === plant?.careProfileId);

  if (isLoading || !plant) {
    return (
      <AppShell>
        <Skeleton className="h-[220px] rounded-3xl mb-4" />
        <Skeleton className="h-32 rounded-3xl mb-4" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Hero
        imageUrl={plant.curatedPhotoUrl ?? fallbackPhotoFor(plant.commonName)}
        title={plant.commonName}
        subtitle={room ? `${room.name} • ${plant.scientificName ?? "Species unknown"}` : plant.scientificName ?? ""}
      />

      <SectionCard testId="card-plant-quick-facts">
        <SectionTitle title="Care schedule" eyebrow="Adjusted for your location" />
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-card-border bg-card">
            <strong className="block text-water-foreground">Water</strong>
            <span className="text-sm text-muted-foreground" data-testid="text-next-water">
              {formatDate(plant.nextWaterDate)}
            </span>
          </div>
          <div className="p-4 rounded-2xl border border-card-border bg-card">
            <strong className="block text-feed-foreground">Feed</strong>
            <span className="text-sm text-muted-foreground" data-testid="text-next-feed">
              {formatDate(plant.nextFeedDate)}
            </span>
          </div>
        </div>
      </SectionCard>

      {careProfile && (
        <SectionCard testId="card-plant-care-details">
          <SectionTitle title="Placement & care" />
          <div className="grid gap-3">
            <div className="p-4 rounded-2xl border border-card-border bg-card">
              <strong className="block">Best placement</strong>
              <span className="text-sm text-muted-foreground">{careProfile.placementNotes}</span>
            </div>
            <div className="p-4 rounded-2xl border border-card-border bg-card">
              <strong className="block">Watering notes</strong>
              <span className="text-sm text-muted-foreground">{careProfile.waterNotes}</span>
            </div>
            <div className="p-4 rounded-2xl border border-card-border bg-card">
              <strong className="block">Feeding notes</strong>
              <span className="text-sm text-muted-foreground">{careProfile.feedNotes}</span>
            </div>
            <div className="p-4 rounded-2xl border border-card-border bg-card">
              <strong className="block">Soil & repotting</strong>
              <span className="text-sm text-muted-foreground">
                {careProfile.soilType}
                {careProfile.repotIntervalMonths ? ` • repot roughly every ${careProfile.repotIntervalMonths} months` : ""}
              </span>
            </div>
            {careProfile.toxicity && (
              <div className="p-4 rounded-2xl border border-card-border bg-card">
                <strong className="block">Toxicity</strong>
                <span className="text-sm text-muted-foreground">{careProfile.toxicity}</span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <SectionCard testId="card-progress-photos">
        <SectionTitle
          title="Growth progress"
          eyebrow={isPremium ? "Full history" : "Free: latest only"}
          action={
            <Link href={`/plants/${plantId}/progress`}>
              <Button size="sm" variant="secondary" className="rounded-full gap-1.5" data-testid="button-add-progress-photo">
                <CameraIcon className="w-3.5 h-3.5" />
                Add photo
              </Button>
            </Link>
          }
        />

        {!progressPhotos || progressPhotos.length === 0 ? (
          <div className="text-sm text-muted-foreground" data-testid="text-no-progress-photos">
            No progress photos yet. Add one to compare growth over time against your original scan.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {(isPremium ? progressPhotos : progressPhotos.slice(-1)).map((photo) => (
              <img
                key={photo.id}
                src={photo.photoUrl}
                alt="Progress"
                className="w-full h-24 object-cover rounded-xl"
                data-testid={`img-progress-${photo.id}`}
              />
            ))}
            {!isPremium && progressPhotos.length > 1 && (
              <Link
                href="/upgrade?reason=progress_history"
                className="w-full h-24 rounded-xl border border-dashed border-primary/40 bg-primary-soft/20 flex flex-col items-center justify-center gap-1 text-primary text-xs font-medium"
                data-testid="link-progress-history-locked"
              >
                <Lock className="w-4 h-4" />
                +{progressPhotos.length - 1} more
              </Link>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard testId="card-plant-shop-cta">
        <SectionTitle title="Keep it thriving" />
        <Link href="/shop">
          <Button className="rounded-full w-full" data-testid="button-plant-shop-cta">
            View recommended fertilizer & supplies
          </Button>
        </Link>
      </SectionCard>
    </AppShell>
  );
}
