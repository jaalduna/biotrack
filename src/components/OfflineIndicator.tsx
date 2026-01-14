import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  isOffline: boolean;
  isUpdateAvailable?: boolean;
  onUpdate?: () => void;
}

export function OfflineIndicator({
  isOffline,
  isUpdateAvailable = false,
  onUpdate,
}: OfflineIndicatorProps) {
  if (!isOffline && !isUpdateAvailable) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-transform duration-300",
        isOffline
          ? "bg-orange-500 text-white"
          : "bg-blue-500 text-white"
      )}
    >
      {isOffline ? (
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>You're offline. Some features may be unavailable.</span>
        </div>
      ) : isUpdateAvailable ? (
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>A new version is available!</span>
          {onUpdate && (
            <button
              onClick={onUpdate}
              className="ml-2 px-3 py-0.5 bg-white/20 hover:bg-white/30 rounded-full text-xs font-semibold transition-colors"
            >
              Update Now
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
