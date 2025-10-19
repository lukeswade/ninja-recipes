import { Card } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <div className="relative h-[400px] md:h-[500px] bg-muted/50 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent shimmer" />
      </div>

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-7 bg-muted/50 rounded-md w-3/4 animate-pulse" />
          <div className="h-7 bg-muted/50 rounded-md w-1/2 animate-pulse" />
        </div>

        {/* Separator */}
        <div className="w-12 h-[1px] bg-accent/30" />

        {/* Meta skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-muted/50 rounded w-20 animate-pulse" />
            <div className="h-4 bg-muted/50 rounded w-16 animate-pulse" />
          </div>
          <div className="h-4 bg-muted/50 rounded w-12 animate-pulse" />
        </div>
      </div>
    </Card>
  );
}
