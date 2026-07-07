import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { SectionCard, SectionTitle } from "@/components/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackPhotoFor } from "@/lib/stock-photos";
import { Plus } from "lucide-react";
import type { Plant, Room } from "@shared/schema";

export default function Plants() {
  const { data: plants, isLoading } = useQuery<Plant[]>({ queryKey: ["/api/plants"] });
  const { data: rooms } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const roomById = new Map((rooms ?? []).map((r) => [r.id, r]));

  return (
    <AppShell>
      <SectionTitle title="Your plants" eyebrow={plants ? `${plants.length} tracked` : undefined} />

      <SectionCard testId="card-plants-list">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/scan"
              className="rounded-2xl border border-dashed border-primary/40 bg-primary-soft/20 flex flex-col items-center justify-center gap-2 h-40 text-primary hover-elevate"
              data-testid="link-add-plant"
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-semibold">Add a plant</span>
            </Link>

            {(plants ?? []).map((plant) => {
              const room = plant.roomId ? roomById.get(plant.roomId) : undefined;
              return (
                <Link
                  key={plant.id}
                  href={`/plants/${plant.id}`}
                  className="rounded-2xl border border-card-border bg-card overflow-hidden hover-elevate flex flex-col"
                  data-testid={`link-plant-${plant.id}`}
                >
                  <img
                    src={plant.curatedPhotoUrl ?? fallbackPhotoFor(plant.commonName)}
                    alt={plant.commonName}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                  <div className="px-3 py-2.5">
                    <strong className="block text-sm truncate" data-testid={`text-plant-name-${plant.id}`}>
                      {plant.commonName}
                    </strong>
                    <span className="block text-xs text-muted-foreground truncate mt-0.5">
                      {room?.name ?? "Unassigned"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && (plants ?? []).length === 0 && (
          <div className="text-sm text-muted-foreground mt-3" data-testid="text-no-plants">
            No plants yet — tap "Add a plant" to take your first picture.
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
