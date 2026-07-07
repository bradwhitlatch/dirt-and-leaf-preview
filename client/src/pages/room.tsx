import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Hero, SectionCard, SectionTitle } from "@/components/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fallbackPhotoFor } from "@/lib/stock-photos";
import { apiRequest } from "@/lib/queryClient";
import type { Plant, Room as RoomType } from "@shared/schema";

export default function Room() {
  const params = useParams();
  const roomId = Number(params.id);

  const { data: room, isLoading: roomLoading } = useQuery<RoomType>({ queryKey: ["/api/rooms", roomId] });
  const { data: rooms } = useQuery<RoomType[]>({ queryKey: ["/api/rooms"] });
  const { data: plants, isLoading: plantsLoading } = useQuery<Plant[]>({
    queryKey: ["/api/plants/room", roomId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/plants/room/${roomId}`);
      return res.json();
    },
  });

  const resolvedRoom = room ?? rooms?.find((r) => r.id === roomId);

  return (
    <AppShell>
      {roomLoading && !resolvedRoom ? (
        <Skeleton className="h-[220px] rounded-3xl mb-4" />
      ) : (
        <Hero
          imageUrl={resolvedRoom?.photoUrl ?? fallbackPhotoFor(resolvedRoom?.name ?? "room")}
          title={resolvedRoom?.name ?? "Room"}
          subtitle="Every plant assigned to this space, with its own watering and feeding schedule."
        />
      )}

      <SectionCard testId="card-room-plants">
        <SectionTitle title="Plants in this space" />
        {plantsLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : (plants ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground" data-testid="text-room-empty">
            No plants in this room yet.{" "}
            <Link href="/scan" className="text-primary font-medium underline">
              Scan one in
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-3">
            {(plants ?? []).map((plant) => (
              <Link
                key={plant.id}
                href={`/plants/${plant.id}`}
                className="grid grid-cols-[56px_1fr] gap-3 items-center p-3 rounded-2xl border border-card-border bg-card hover-elevate"
                data-testid={`link-room-plant-${plant.id}`}
              >
                <img
                  src={plant.curatedPhotoUrl ?? fallbackPhotoFor(plant.commonName)}
                  alt={plant.commonName}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <strong className="block truncate">{plant.commonName}</strong>
                  <span className="text-sm text-muted-foreground truncate block">
                    {plant.scientificName ?? "Species unknown"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
