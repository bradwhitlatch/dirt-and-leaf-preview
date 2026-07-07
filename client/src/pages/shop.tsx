import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Hero, SectionCard, SectionTitle } from "@/components/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { apiRequest } from "@/lib/queryClient";
import { STOCK_PHOTOS } from "@/lib/stock-photos";
import { MapPin, ExternalLink } from "lucide-react";
import type { AffiliateLink } from "@shared/schema";

interface Nursery {
  id: string;
  name: string;
  address?: string;
  distanceMiles?: number;
  mapsUrl: string;
}

export default function Shop() {
  const geo = useGeolocation();

  const { data: affiliateLinks, isLoading: linksLoading } = useQuery<(AffiliateLink & { url: string })[]>({
    queryKey: ["/api/affiliate-links"],
  });

  const { data: nurseries, isLoading: nurseriesLoading } = useQuery<Nursery[]>({
    queryKey: ["/api/nurseries", geo.lat, geo.lon],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/nurseries?lat=${geo.lat}&lon=${geo.lon}`);
      return res.json();
    },
    enabled: geo.lat != null && geo.lon != null,
  });

  return (
    <AppShell>
      <Hero
        imageUrl={STOCK_PHOTOS.products}
        title="Shop"
        subtitle="Fertilizer, soil, and tools matched to your plants, plus nurseries nearby."
        heightClass="h-[160px]"
      />

      <SectionCard testId="card-affiliate-products">
        <SectionTitle title="Recommended products" eyebrow="Amazon" />
        {linksLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-3">
            {(affiliateLinks ?? []).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-card-border bg-card hover-elevate"
                data-testid={`link-affiliate-${link.category}`}
              >
                <div className="min-w-0">
                  <strong className="block truncate">{link.label}</strong>
                  <span className="text-xs text-muted-foreground">Opens on Amazon</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3" data-testid="text-affiliate-disclosure">
          Dirt &amp; Leaf may earn a commission from purchases made through these links, at no extra cost to you.
        </p>
      </SectionCard>

      <SectionCard testId="card-nearby-nurseries">
        <SectionTitle title="Nearby nurseries" eyebrow="OpenStreetMap" />
        {geo.status === "loading" || nurseriesLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : !nurseries || nurseries.length === 0 ? (
          <div className="text-sm text-muted-foreground" data-testid="text-no-nurseries">
            No nurseries found nearby. Try again with location access enabled.
          </div>
        ) : (
          <div className="grid gap-3">
            {nurseries.map((n) => (
              <a
                key={n.id}
                href={n.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-2xl border border-card-border bg-card hover-elevate"
                data-testid={`link-nursery-${n.id}`}
              >
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <strong className="block truncate">{n.name}</strong>
                  <span className="text-xs text-muted-foreground truncate block">
                    {n.address ?? "Address unavailable"}
                    {n.distanceMiles != null ? ` • ${n.distanceMiles.toFixed(1)} mi` : ""}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
