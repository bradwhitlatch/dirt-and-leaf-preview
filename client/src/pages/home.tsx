import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Hero, SectionCard, SectionTitle } from "@/components/section-card";
import { CameraCapture } from "@/components/camera-capture";
import { TaskItem } from "@/components/task-item";
import { TaskSheet, type TaskSheetData } from "@/components/task-sheet";
import { STOCK_PHOTOS, fallbackPhotoFor } from "@/lib/stock-photos";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useLocation } from "wouter";
import type { Room, Plant, Reminder, CareProfile } from "@shared/schema";

function relativeDue(dueDate: number) {
  const days = Math.round((dueDate - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [sheetData, setSheetData] = useState<TaskSheetData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: plants } = useQuery<Plant[]>({ queryKey: ["/api/plants"] });
  const { data: reminders, isLoading: remindersLoading } = useQuery<Reminder[]>({ queryKey: ["/api/reminders"] });
  const { data: careProfiles } = useQuery<CareProfile[]>({ queryKey: ["/api/care-profiles"] });

  const plantById = new Map((plants ?? []).map((p) => [p.id, p]));
  const roomById = new Map((rooms ?? []).map((r) => [r.id, r]));

  const pendingReminders = (reminders ?? [])
    .filter((r) => r.status === "pending")
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 5);

  function openReminder(reminder: Reminder) {
    const plant = plantById.get(reminder.plantId);
    if (!plant) return;
    const room = plant.roomId ? roomById.get(plant.roomId) : undefined;
    const profile = careProfiles?.find((c) => c.id === plant.careProfileId);
    const typeLabel = reminder.type === "water" ? "Water now" : reminder.type === "feed" ? "Feed now" : "Care check";

    const steps =
      reminder.type === "water"
        ? [
            "Check that the top inch of soil feels dry first.",
            profile?.waterNotes ?? "Water slowly until the root zone is evenly moist.",
            "Empty excess tray water so roots don't sit wet.",
          ]
        : reminder.type === "feed"
        ? [
            profile?.feedNotes ?? "Use a balanced houseplant fertilizer at the recommended dilution.",
            "Apply into already-damp soil, avoid pouring directly onto the crown.",
            "This timing is adjusted for current season, humidity, and your location.",
          ]
        : [profile?.placementNotes ?? "Check placement and adjust light exposure as needed."];

    setSheetData({
      title: typeLabel,
      type: reminder.type as any,
      plantName: plant.commonName,
      meta: room ? `${room.name} • ${relativeDue(reminder.dueDate)}` : relativeDue(reminder.dueDate),
      imageUrl: plant.curatedPhotoUrl ?? fallbackPhotoFor(plant.commonName),
      steps,
      cta:
        reminder.type === "water"
          ? { text: "Buy water supplies", url: "/#/shop" }
          : reminder.type === "feed"
          ? { text: "Buy plant food", url: "/#/shop" }
          : undefined,
    });
    setSheetOpen(true);
  }

  return (
    <AppShell>
      <Hero
        imageUrl={STOCK_PHOTOS.heroPlant}
        title="Take a picture"
        subtitle="One scan leads to plant ID, room assignment, reminders, and product suggestions."
      />

      <SectionCard testId="card-scan-cta">
        <div className="mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Scan</div>
          <strong className="block">Take a picture</strong>
          <span className="text-sm text-muted-foreground">
            Point the camera at your plant and let Dirt &amp; Leaf do the rest.
          </span>
        </div>
        <CameraCapture
          label="Take a picture"
          testId="button-home-scan"
          onCapture={(dataUrl) => {
            sessionStorage.setItem("__pending_scan_ignored__", "");
            navigate(`/scan?pending=1`);
            // Stash the captured image in a module-level holder via query param is not viable for large data URLs,
            // so we use a tiny in-memory bridge on window instead (no localStorage/sessionStorage per platform rules).
            (window as any).__dirtAndLeafPendingCapture = dataUrl;
          }}
        />
      </SectionCard>

      <SectionCard testId="card-spaces">
        <SectionTitle title="Spaces" eyebrow="Room-based care" />
        {roomsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(rooms ?? []).map((room) => {
              const roomPlants = (plants ?? []).filter((p) => p.roomId === room.id);
              const summary =
                roomPlants.length > 0
                  ? roomPlants
                      .slice(0, 2)
                      .map((p) => p.commonName)
                      .join(", ")
                  : "No plants yet";
              return (
                <Link
                  key={room.id}
                  href={`/rooms/${room.id}`}
                  className="rounded-2xl border border-card-border bg-card overflow-hidden hover-elevate"
                  data-testid={`link-room-${room.id}`}
                >
                  <img
                    src={room.photoUrl ?? fallbackPhotoFor(room.name)}
                    alt={room.name}
                    className="w-full h-[116px] object-cover"
                    loading="lazy"
                  />
                  <div className="px-4 py-3">
                    <strong className="block">{room.name}</strong>
                    <span className="block text-sm text-muted-foreground mt-0.5">{summary}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>

      <a
        className="flex items-center justify-center w-full py-3 px-4 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm mb-4"
        href="https://www.google.com/maps/search/plant+nursery+near+me/"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="link-buy-more-plants"
      >
        Buy more plants
      </a>

      <SectionCard testId="card-reminders">
        <SectionTitle title="Reminders" eyebrow="Under spaces" />
        {remindersLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : pendingReminders.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2" data-testid="text-no-reminders">
            No reminders yet — save a plant to start getting watering and feeding reminders.
          </div>
        ) : (
          <div className="grid gap-3">
            {pendingReminders.map((reminder) => {
              const plant = plantById.get(reminder.plantId);
              const room = plant?.roomId ? roomById.get(plant.roomId) : undefined;
              if (!plant) return null;
              return (
                <TaskItem
                  key={reminder.id}
                  type={reminder.type as any}
                  badge={plant.commonName[0]?.toUpperCase() ?? "P"}
                  title={plant.commonName}
                  subtitle={`${room?.name ?? "Unassigned"} • ${reminder.type} ${relativeDue(reminder.dueDate)}`}
                  onClick={() => openReminder(reminder)}
                  testId={`button-reminder-${reminder.id}`}
                />
              );
            })}
          </div>
        )}
      </SectionCard>

      <TaskSheet open={sheetOpen} onOpenChange={setSheetOpen} data={sheetData} />
    </AppShell>
  );
}
