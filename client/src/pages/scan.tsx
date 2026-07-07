import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Hero, SectionCard, SectionTitle } from "@/components/section-card";
import { CameraCapture } from "@/components/camera-capture";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { STOCK_PHOTOS, fallbackPhotoFor } from "@/lib/stock-photos";
import { cn } from "@/lib/utils";
import type { Room, CareProfile } from "@shared/schema";
import { FREE_PLANT_LIMIT } from "@shared/pricing";

interface PlantSuggestion {
  id: string;
  commonName: string;
  scientificName: string;
  probability: number;
  similarImageUrl: string;
  reasoning?: string;
  careProfileId?: number | null;
  speciesKey?: string | null;
  inDatabase?: boolean;
  distinguishingTraits?: string | null;
}

function profileToSuggestion(p: CareProfile): PlantSuggestion {
  return {
    id: `profile-${p.id}`,
    commonName: p.commonName,
    scientificName: p.scientificName,
    probability: 1,
    similarImageUrl: fallbackPhotoFor(p.speciesKey),
    reasoning: undefined,
    careProfileId: p.id,
    speciesKey: p.speciesKey,
    inDatabase: true,
    distinguishingTraits: p.distinguishingTraits ?? null,
  };
}

export default function Scan() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const geo = useGeolocation();

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlantSuggestion[]>([]);
  const [selected, setSelected] = useState<PlantSuggestion | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [plantNameOverride, setPlantNameOverride] = useState<string | null>(null);
  const [identifiedVia, setIdentifiedVia] = useState<"photo" | "tag" | "search">("photo");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: rooms } = useQuery<Room[]>({ queryKey: ["/api/rooms"] });
  const { data: careProfiles } = useQuery<CareProfile[]>({ queryKey: ["/api/care-profiles"] });

  useEffect(() => {
    const pending = (window as any).__dirtAndLeafPendingCapture as string | undefined;
    if (pending) {
      setCapturedImage(pending);
      (window as any).__dirtAndLeafPendingCapture = undefined;
      runIdentify(pending);
    }
    if (rooms && rooms.length > 0 && selectedRoomId == null) {
      setSelectedRoomId(rooms[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  const identifyMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const res = await apiRequest("POST", "/api/identify", { imageBase64 });
      return res.json();
    },
    onSuccess: (data) => {
      const top = data.suggestions ?? [];
      setSuggestions(top);
      setSelected(top[0] ?? null);
      setPlantNameOverride(null);
      setIdentifiedVia("photo");
      if (data.mock) {
        toast({
          title: "Using demo identification",
          description: "Add an ANTHROPIC_API_KEY to enable live AI plant identification.",
        });
      }
    },
    onError: () => {
      toast({ title: "Identification failed", description: "Please try another photo.", variant: "destructive" });
    },
  });

  const tagMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const res = await apiRequest("POST", "/api/identify-tag", { imageBase64 });
      return res.json();
    },
    onSuccess: (data) => {
      setIdentifiedVia("tag");
      setPlantNameOverride(null);
      if (data.match) {
        const suggestion = profileToSuggestion(data.match);
        suggestion.reasoning = `Read from the plant tag: "${data.rawText || data.commonName || data.scientificName}"`;
        setSuggestions([suggestion]);
        setSelected(suggestion);
      } else {
        // Tag read but not in our care database yet — still let the user save
        // by name, flagged as not-yet-in-database.
        const name = data.commonName || data.scientificName || "";
        if (name) {
          const suggestion: PlantSuggestion = {
            id: "tag-raw",
            commonName: name,
            scientificName: data.scientificName || name,
            probability: data.confidence ?? 0.8,
            similarImageUrl: fallbackPhotoFor(name),
            reasoning: `Read from the plant tag: "${data.rawText || name}"`,
            careProfileId: null,
            inDatabase: false,
          };
          setSuggestions([suggestion]);
          setSelected(suggestion);
        } else {
          toast({ title: "Couldn't read the tag", description: "Try a clearer photo of the label, or search by name.", variant: "destructive" });
        }
      }
      if (data.mock) {
        toast({
          title: "Using demo tag reading",
          description: "Add an ANTHROPIC_API_KEY to enable live label OCR.",
        });
      }
    },
    onError: () => {
      toast({ title: "Tag reading failed", description: "Please try another photo of the tag.", variant: "destructive" });
    },
  });

  function runIdentify(imageBase64: string) {
    identifyMutation.mutate(imageBase64);
  }

  const { data: searchResults, isFetching: searchLoading } = useQuery<CareProfile[]>({
    queryKey: ["/api/care-profiles/search", searchQuery],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/care-profiles/search?q=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: showSearch && searchQuery.trim().length >= 2,
  });

  function chooseFromSearch(profile: CareProfile) {
    const suggestion = profileToSuggestion(profile);
    setSuggestions([suggestion]);
    setSelected(suggestion);
    setPlantNameOverride(null);
    setIdentifiedVia("search");
    setShowSearch(false);
  }

  const activeName = plantNameOverride ?? selected?.commonName ?? "";
  const careProfile = careProfiles?.find(
    (c) => c.commonName.toLowerCase() === activeName.toLowerCase() || c.scientificName.toLowerCase() === (selected?.scientificName ?? "").toLowerCase()
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selected || !selectedRoomId) throw new Error("Missing selection");
      const payload = {
        roomId: selectedRoomId,
        commonName: activeName,
        scientificName: selected.scientificName,
        curatedPhotoUrl: selected.similarImageUrl,
        userPhotoUrl: capturedImage,
        confirmedConfidence: selected.probability,
        matchCandidates: JSON.stringify(suggestions),
        locationLat: geo.lat,
        locationLon: geo.lon,
        careProfileId: selected.careProfileId ?? careProfile?.id ?? null,
      };
      const res = await apiRequest("POST", "/api/plants", payload);
      return res.json();
    },
    onSuccess: (plant) => {
      qc.invalidateQueries({ queryKey: ["/api/plants"] });
      qc.invalidateQueries({ queryKey: ["/api/reminders"] });
      qc.invalidateQueries({ queryKey: ["/api/account"] });
      toast({ title: `${plant.commonName} saved`, description: "Added to your Plants list." });
      navigate("/plants");
    },
    onError: async (err: any) => {
      const message = String(err?.message ?? "");
      if (message.startsWith("402")) {
        navigate("/upgrade?reason=plant_limit");
        return;
      }
      toast({ title: "Couldn't save plant", description: message, variant: "destructive" });
    },
  });

  const roomName = rooms?.find((r) => r.id === selectedRoomId)?.name ?? "a room";
  const busy = identifyMutation.isPending || tagMutation.isPending;
  const hasResults = capturedImage || suggestions.length > 0;

  return (
    <AppShell>
      <Hero
        imageUrl={capturedImage ?? STOCK_PHOTOS.heroPlant}
        title="Take a picture"
        subtitle="Review the match, compare look-alikes, choose a room, and save the plant."
      />

      {!hasResults && (
        <SectionCard testId="card-scan-start">
          <CameraCapture
            label="Take a picture"
            testId="button-scan-camera"
            onCapture={(dataUrl) => {
              setCapturedImage(dataUrl);
              runIdentify(dataUrl);
            }}
          />

          {/* Lightweight secondary options — the primary flow is still one photo. */}
          <div className="mt-3 grid gap-2.5">
            <CameraCapture
              label="Got a tag? Snap that instead"
              testId="button-scan-tag"
              onCapture={(dataUrl) => {
                setCapturedImage(dataUrl);
                tagMutation.mutate(dataUrl);
              }}
            />
            <button
              onClick={() => setShowSearch((v) => !v)}
              className="text-sm text-primary underline underline-offset-4 justify-self-center"
              data-testid="button-toggle-search"
            >
              Know the name? Search instead
            </button>
          </div>

          {showSearch && (
            <div className="mt-3 grid gap-2.5" data-testid="card-name-search">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a plant name, e.g. Monstera"
                className="w-full px-4 py-3 rounded-2xl bg-surface-2 border border-border text-sm outline-none focus:border-primary/40"
                data-testid="input-name-search"
                autoFocus
              />
              {searchQuery.trim().length >= 2 && (
                <div className="grid gap-2" data-testid="list-search-results">
                  {searchLoading && <Skeleton className="h-12 rounded-2xl" />}
                  {!searchLoading && (searchResults?.length ?? 0) === 0 && (
                    <div className="px-4 py-3 rounded-2xl bg-surface-2 border border-border text-sm text-muted-foreground">
                      No matches in our care database yet.
                    </div>
                  )}
                  {searchResults?.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => chooseFromSearch(p)}
                      className="w-full text-left px-4 py-3 rounded-2xl border border-card-border bg-card"
                      data-testid={`button-search-result-${p.id}`}
                    >
                      <strong className="block">{p.commonName}</strong>
                      <span className="text-sm text-muted-foreground italic">{p.scientificName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </SectionCard>
      )}

      {hasResults && (
        <SectionCard testId="card-best-matches">
          <SectionTitle
            title={identifiedVia === "tag" ? "From your tag" : identifiedVia === "search" ? "Your selection" : "Best matches"}
            eyebrow={identifiedVia === "photo" ? "Top 3 if unsure" : identifiedVia === "tag" ? "Read from the label" : "Chosen by name"}
          />
          {busy ? (
            <div className="grid gap-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : (
            <div className="grid gap-3" data-testid="list-matches">
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelected(s);
                    setPlantNameOverride(null);
                  }}
                  className={cn(
                    "w-full text-left grid grid-cols-[76px_1fr] gap-3.5 items-center p-4 rounded-2xl border bg-card",
                    selected?.id === s.id ? "border-primary/40 bg-primary-soft/25" : "border-card-border"
                  )}
                  data-testid={`button-match-${i}`}
                >
                  <img src={s.similarImageUrl} alt={s.commonName} className="w-[76px] h-[76px] rounded-xl object-cover" />
                  <div>
                    <strong className="block">{s.commonName}</strong>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(s.probability * 100)}% confidence
                      {identifiedVia === "photo" ? (i === 0 ? " • best match" : " • look-alike option") : ""}
                    </span>
                    {s.reasoning && (
                      <span className="block text-xs text-muted-foreground mt-1" data-testid={`text-reasoning-${i}`}>
                        {s.reasoning}
                      </span>
                    )}
                    {s.inDatabase === false && (
                      <span className="block text-xs text-amber-500 mt-1" data-testid={`text-not-in-db-${i}`}>
                        Not in our care database yet — we'll still save it, but tailored care tips aren't available.
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 1 && (
            <>
              <SectionTitle title="Visual compare" eyebrow="When unsure" />
              <div className="grid grid-cols-3 gap-3 mb-2">
                {suggestions.slice(0, 3).map((s) => (
                  <div key={s.id} className="rounded-2xl border border-card-border bg-card p-3" data-testid={`tile-compare-${s.id}`}>
                    <img src={s.similarImageUrl} alt={s.commonName} className="w-full h-[80px] rounded-xl object-cover mb-2" />
                    <strong className="block text-sm leading-tight">{s.commonName}</strong>
                  </div>
                ))}
              </div>
            </>
          )}

          {rooms && rooms.length > 0 && (
            <>
              <SectionTitle title="Room" eyebrow={`${roomName} selected`} />
              <div className="flex flex-wrap gap-2 mb-2">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-sm border",
                      selectedRoomId === room.id
                        ? "bg-primary-soft text-primary border-primary/30"
                        : "bg-surface-2 border-border"
                    )}
                    data-testid={`button-room-chip-${room.id}`}
                  >
                    {room.name}
                  </button>
                ))}
              </div>
              <div className="px-4 py-3 rounded-2xl bg-surface-2 border border-border text-sm text-muted-foreground">
                This scan will save into the {roomName} after you confirm the plant match.
              </div>
            </>
          )}
        </SectionCard>
      )}

      {selected && (
        <SectionCard testId="card-save-plant">
          <SectionTitle title="Save this plant" eyebrow={roomName} />
          <div className="p-4 rounded-2xl border border-card-border bg-card">
            <strong className="block" data-testid="text-save-plant-name">{activeName}</strong>
            <span className="text-sm text-muted-foreground">
              This creates a plant profile with a curated image; your photo is saved only for identification and
              progress analysis.
            </span>
            <div className="mt-3 px-4 py-3 rounded-2xl bg-surface-2 border border-border text-sm text-muted-foreground">
              Plant name: {activeName}
            </div>
            <div className="grid gap-2.5 mt-4">
              <Button
                className="rounded-full"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !selectedRoomId}
                data-testid="button-save-plant"
              >
                {saveMutation.isPending ? "Saving…" : "Save plant"}
              </Button>
              <Button variant="secondary" className="rounded-full" onClick={() => navigate("/plants")} data-testid="button-go-to-plants">
                Go to plants
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {careProfile && (
        <SectionCard testId="card-quick-read">
          <SectionTitle title="Quick read" />
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-card-border bg-card">
              <strong className="block">Watering</strong>
              <span className="text-sm text-muted-foreground">
                Every {careProfile.waterIntervalDaysMin}–{careProfile.waterIntervalDaysMax} days
              </span>
            </div>
            <div className="p-4 rounded-2xl border border-card-border bg-card">
              <strong className="block">Feeding</strong>
              <span className="text-sm text-muted-foreground">Every {careProfile.feedIntervalDaysActive} days (active season)</span>
            </div>
            <div className="p-4 rounded-2xl border border-card-border bg-card">
              <strong className="block">Soil</strong>
              <span className="text-sm text-muted-foreground">{careProfile.soilType}</span>
            </div>
            <div className="p-4 rounded-2xl border border-card-border bg-card">
              <strong className="block">Placement</strong>
              <span className="text-sm text-muted-foreground">{careProfile.lightRequirement.replace(/_/g, " ")}</span>
            </div>
          </div>
        </SectionCard>
      )}
    </AppShell>
  );
}
