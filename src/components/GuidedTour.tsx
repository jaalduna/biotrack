import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourStep {
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  spotlightPadding?: number;
  onShow?: () => void;
}

interface GuidedTourProps {
  steps: TourStep[];
  tourId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  startAutomatically?: boolean;
}

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

const TOUR_STORAGE_KEY = "biotrack_completed_tours";

function getCompletedTours(): string[] {
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markTourCompleted(tourId: string): void {
  const completed = getCompletedTours();
  if (!completed.includes(tourId)) {
    completed.push(tourId);
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completed));
  }
}

export function isTourCompleted(tourId: string): boolean {
  return getCompletedTours().includes(tourId);
}

export function resetTour(tourId: string): void {
  const completed = getCompletedTours().filter((id) => id !== tourId);
  localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completed));
}

export function resetAllTours(): void {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}

export function GuidedTour({
  steps,
  tourId,
  onComplete,
  onSkip,
  startAutomatically = true,
}: GuidedTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightPosition, setSpotlightPosition] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // Check if tour should start automatically
  useEffect(() => {
    if (startAutomatically && !isTourCompleted(tourId) && steps.length > 0) {
      // Delay start to ensure page is fully rendered
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tourId, startAutomatically, steps.length]);

  // Calculate positions when step changes
  const updatePositions = useCallback(() => {
    if (!isActive || !step) return;

    // Handle center placement (no target element)
    if (step.placement === "center" || !step.target) {
      setSpotlightPosition(null);
      setTooltipPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      });
      return;
    }

    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      console.warn(`Tour target not found: ${step.target}`);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const padding = step.spotlightPadding ?? 8;

    // Set spotlight position
    setSpotlightPosition({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on placement
    const placement = step.placement || "bottom";
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const gap = 16;

    let top = 0;
    let left = 0;

    switch (placement) {
      case "top":
        top = rect.top + window.scrollY - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + window.scrollY + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
        break;
      case "right":
        top = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, top);

    setTooltipPosition({ top, left });

    // Scroll target into view if needed
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

    // Call onShow callback
    step.onShow?.();
  }, [isActive, step]);

  useEffect(() => {
    updatePositions();

    // Update on resize
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, [updatePositions, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    markTourCompleted(tourId);
    setIsActive(false);
    setCurrentStep(0);
    onComplete?.();
  };

  const handleSkip = () => {
    markTourCompleted(tourId);
    setIsActive(false);
    setCurrentStep(0);
    onSkip?.();
  };

  // Public method to start tour programmatically
  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  // Expose startTour method
  useEffect(() => {
    // @ts-expect-error - Attaching to window for global access
    window[`startTour_${tourId}`] = startTour;
    return () => {
      // @ts-expect-error - Clean up
      delete window[`startTour_${tourId}`];
    };
  }, [tourId, startTour]);

  if (!isActive || !step) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay with spotlight cutout */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />

        {/* Spotlight cutout */}
        {spotlightPosition && (
          <div
            className="absolute bg-transparent rounded-lg ring-4 ring-primary ring-offset-4 ring-offset-transparent transition-all duration-300"
            style={{
              top: spotlightPosition.top,
              left: spotlightPosition.left,
              width: spotlightPosition.width,
              height: spotlightPosition.height,
              boxShadow: `
                0 0 0 9999px rgba(0, 0, 0, 0.6),
                0 0 20px rgba(59, 130, 246, 0.5)
              `,
            }}
          />
        )}
      </div>

      {/* Click blocker (allows clicking spotlight area) */}
      <div
        className="absolute inset-0"
        onClick={(e) => {
          // Allow clicks inside spotlight area
          if (spotlightPosition) {
            const x = e.clientX;
            const y = e.clientY + window.scrollY;
            if (
              x >= spotlightPosition.left &&
              x <= spotlightPosition.left + spotlightPosition.width &&
              y >= spotlightPosition.top &&
              y <= spotlightPosition.top + spotlightPosition.height
            ) {
              return;
            }
          }
          e.stopPropagation();
        }}
      />

      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className={cn(
          "absolute w-80 p-4 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300",
          step.placement === "center" && "transform -translate-x-1/2 -translate-y-1/2"
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          zIndex: 10000,
        }}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close tour"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Header with sparkle */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">{step.title}</h3>
        </div>

        {/* Content */}
        <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

        {/* Progress and navigation */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={handlePrevious} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="gap-1">
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Step counter */}
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Step {currentStep + 1} of {steps.length}
        </p>
      </Card>
    </div>,
    document.body
  );
}

// Hook for using the tour
export function useTour(tourId: string) {
  const [isCompleted, setIsCompleted] = useState(() => isTourCompleted(tourId));

  const startTour = useCallback(() => {
    // @ts-expect-error - Accessing global tour start function
    const tourStart = window[`startTour_${tourId}`];
    if (tourStart) {
      tourStart();
    }
  }, [tourId]);

  const reset = useCallback(() => {
    resetTour(tourId);
    setIsCompleted(false);
  }, [tourId]);

  return {
    isCompleted,
    startTour,
    reset,
  };
}
