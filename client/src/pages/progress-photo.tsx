import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { SectionCard, SectionTitle } from "@/components/section-card";
import { CameraCapture } from "@/components/camera-capture";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { fallbackPhotoFor } from "@/lib/stock-photos";
import type { Plant } from "@shared/schema";

export default function ProgressPhotoPage() {
  const params = useParams();
  const plantId = Number(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data: plant } = useQuery<Plant>({ queryKey: ["/api/plants", plantId] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/plants/${plantId}/progress-photos`, {
        photoUrl: photo,
        note: note || null,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/plants", plantId, "progress-photos"] });
      toast({ title: "Progress photo saved" });
      navigate(`/plants/${plantId}`);
    },
    onError: () => {
      toast({ title: "Couldn't save photo", variant: "destructive" });
    },
  });

  return (
    <AppShell>
      <SectionTitle title="Track growth" eyebrow={plant?.commonName} />

      <SectionCard testId="card-progress-original">
        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Original scan</div>
            <img
              src={plant?.curatedPhotoUrl ?? fallbackPhotoFor(plant?.commonName ?? "plant")}
              alt="Original"
              className="w-full h-32 object-cover rounded-2xl"
            />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">New photo</div>
            {photo ? (
              <img src={photo} alt="New progress" className="w-full h-32 object-cover rounded-2xl" />
            ) : (
              <div className="w-full h-32 rounded-2xl border border-dashed border-border grid place-items-center text-xs text-muted-foreground">
                Not taken yet
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard testId="card-progress-capture">
        <CameraCapture label="Take progress photo" testId="button-capture-progress" onCapture={setPhoto} />
        <Textarea
          className="mt-3"
          placeholder="Optional note — new leaf, repotted, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          data-testid="input-progress-note"
        />
        <Button
          className="rounded-full w-full mt-3"
          disabled={!photo || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          data-testid="button-save-progress-photo"
        >
          {saveMutation.isPending ? "Saving…" : "Save progress photo"}
        </Button>
      </SectionCard>
    </AppShell>
  );
}
