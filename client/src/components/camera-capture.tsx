import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

/**
 * Simple photo capture control. Uses a native file input with
 * `capture="environment"` which opens the device camera directly on mobile
 * browsers, and falls back to a normal file picker everywhere else
 * (including this sandboxed preview). Converts the chosen image to a base64
 * data URL for /api/identify and progress-photo uploads.
 */
export function CameraCapture({
  label = "Take a picture",
  onCapture,
  testId = "button-camera-capture",
}: {
  label?: string;
  onCapture: (dataUrl: string) => void;
  testId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onCapture(reader.result as string);
      setBusy(false);
    };
    reader.onerror = () => setBusy(false);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
        data-testid="input-camera-file"
      />
      <Button
        className="w-full rounded-full gap-2"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        data-testid={testId}
      >
        <Camera className="w-[18px] h-[18px]" />
        {busy ? "Processing…" : label}
      </Button>
    </>
  );
}
