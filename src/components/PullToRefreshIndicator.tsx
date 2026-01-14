import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  progress: number;
  pullDistance: number;
}

export function PullToRefreshIndicator({
  isRefreshing,
  progress,
  pullDistance,
}: PullToRefreshIndicatorProps) {
  const isVisible = pullDistance > 10 || isRefreshing;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 bg-primary text-primary-foreground transition-all duration-200",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        transform: `translateY(${isRefreshing ? 0 : Math.min(pullDistance - 10, 50)}px)`,
      }}
    >
      <RefreshCw
        className={cn(
          "h-5 w-5 mr-2 transition-transform",
          isRefreshing && "animate-spin"
        )}
        style={{
          transform: isRefreshing
            ? undefined
            : `rotate(${progress * 360}deg)`,
        }}
      />
      <span className="text-sm font-medium">
        {isRefreshing
          ? "Refreshing..."
          : progress >= 1
          ? "Release to refresh"
          : "Pull to refresh"}
      </span>
    </div>
  );
}
