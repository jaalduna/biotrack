import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Rocket, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  badge?: "new" | "improved" | "beta";
}

interface ReleaseInfo {
  version: string;
  date: string;
  headline: string;
  features: Feature[];
}

interface WhatsNewModalProps {
  release: ReleaseInfo;
  onDismiss?: () => void;
}

const WHATS_NEW_STORAGE_KEY = "biotrack_seen_releases";

function getSeenReleases(): string[] {
  try {
    const stored = localStorage.getItem(WHATS_NEW_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markReleaseSeen(version: string): void {
  const seen = getSeenReleases();
  if (!seen.includes(version)) {
    seen.push(version);
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, JSON.stringify(seen));
  }
}

export function hasSeenRelease(version: string): boolean {
  return getSeenReleases().includes(version);
}

const BADGE_STYLES = {
  new: "bg-green-500/10 text-green-700 border-green-200",
  improved: "bg-blue-500/10 text-blue-700 border-blue-200",
  beta: "bg-amber-500/10 text-amber-700 border-amber-200",
};

const BADGE_LABELS = {
  new: "New",
  improved: "Improved",
  beta: "Beta",
};

export function WhatsNewModal({ release, onDismiss }: WhatsNewModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen this release
    if (!hasSeenRelease(release.version)) {
      // Delay showing to not interrupt initial page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [release.version]);

  const handleDismiss = () => {
    markReleaseSeen(release.version);
    setIsOpen(false);
    onDismiss?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                What's New
                <Badge variant="outline" className="text-xs font-normal">
                  v{release.version}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {release.date}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-lg font-medium text-foreground mb-4">
            {release.headline}
          </p>

          <div className="space-y-3">
            {release.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="p-1 rounded-full bg-primary/10 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">
                      {feature.title}
                    </span>
                    {feature.badge && (
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", BADGE_STYLES[feature.badge])}
                      >
                        {BADGE_LABELS[feature.badge]}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
            Got it
          </Button>
          <Button onClick={handleDismiss} className="w-full sm:w-auto gap-2">
            <Star className="h-4 w-4" />
            Let's explore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Current release information
export const CURRENT_RELEASE: ReleaseInfo = {
  version: "2.0.0",
  date: "January 2026",
  headline: "Enhanced UX & Mobile Experience",
  features: [
    {
      title: "Progressive Web App",
      description: "Install BioTrack on your device for offline access and quick launch from home screen.",
      badge: "new",
    },
    {
      title: "Patient Notes",
      description: "Add categorized notes and comments to patient records for better team communication.",
      badge: "new",
    },
    {
      title: "Export & Print",
      description: "Export patient data to CSV or print comprehensive reports for offline use.",
      badge: "new",
    },
    {
      title: "Treatment Timeline",
      description: "Enhanced timeline visualization with zoom controls and color-coded antibiotics.",
      badge: "improved",
    },
    {
      title: "Touch Optimization",
      description: "Improved mobile experience with larger touch targets and swipe gestures.",
      badge: "improved",
    },
  ],
};
