import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, TrendingUp, ZoomIn, ZoomOut, Calendar, Pause, Play, CheckCircle2 } from "lucide-react";

interface TreatmentPeriod {
  id: string;
  antibioticName: string;
  antibioticType: "antibiotic" | "corticoide";
  startDate: Date;
  endDate: Date;
  daysApplied: number;
  programmedDays: number;
  status: "active" | "suspended" | "extended" | "finished";
}

interface AntibioticTimelineProps {
  treatments: TreatmentPeriod[];
}

type ZoomLevel = "day" | "week" | "month";

// Color palette for different antibiotics (color-blind friendly)
const ANTIBIOTIC_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/50", fill: "bg-blue-500", border: "border-blue-300 dark:border-blue-700", text: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", fill: "bg-emerald-500", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-violet-100 dark:bg-violet-900/50", fill: "bg-violet-500", border: "border-violet-300 dark:border-violet-700", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-amber-100 dark:bg-amber-900/50", fill: "bg-amber-500", border: "border-amber-300 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-rose-100 dark:bg-rose-900/50", fill: "bg-rose-500", border: "border-rose-300 dark:border-rose-700", text: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/50", fill: "bg-cyan-500", border: "border-cyan-300 dark:border-cyan-700", text: "text-cyan-700 dark:text-cyan-300" },
  { bg: "bg-orange-100 dark:bg-orange-900/50", fill: "bg-orange-500", border: "border-orange-300 dark:border-orange-700", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-teal-100 dark:bg-teal-900/50", fill: "bg-teal-500", border: "border-teal-300 dark:border-teal-700", text: "text-teal-700 dark:text-teal-300" },
];

export function AntibioticTimeline({ treatments }: AntibioticTimelineProps) {
  // IMPORTANT: All hooks must be called at the top level before any conditional returns
  // This follows React's Rules of Hooks

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("day");

  // Map antibiotic names to colors
  const antibioticColorMap = useMemo(() => {
    const colorMap = new Map<string, typeof ANTIBIOTIC_COLORS[0]>();
    const uniqueAntibiotics = [...new Set(treatments.map(t => t.antibioticName))];
    uniqueAntibiotics.forEach((name, index) => {
      colorMap.set(name, ANTIBIOTIC_COLORS[index % ANTIBIOTIC_COLORS.length]);
    });
    return colorMap;
  }, [treatments]);

  // Calculate the timeline data
  const timelineData = useMemo(() => {
    if (treatments.length === 0) {
      console.log("No treatments");
      return null;
    }

    // Ensure all dates are valid Date objects
    const validTreatments = treatments.filter(t => {
      const isStartDateValid = t.startDate instanceof Date && !isNaN(t.startDate.getTime());
      const isEndDateValid = t.endDate instanceof Date && !isNaN(t.endDate.getTime());
      if (!isStartDateValid || !isEndDateValid) {
        console.warn("Invalid date in treatment:", t, { isStartDateValid, isEndDateValid });
      }
      return isStartDateValid && isEndDateValid;
    });

    if (validTreatments.length === 0) {
      console.log("No valid treatments after filtering");
      return null;
    }

    // Find the earliest start date and latest end date
    const allDates = validTreatments.flatMap((t) => [t.startDate, t.endDate]);
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    console.log("Date range:", { minDate, maxDate, minTime: minDate.getTime(), maxTime: maxDate.getTime() });

    // Calculate total days in timeline
    const totalDays =
      Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    console.log("Total days in timeline:", totalDays);

    // Group treatments by antibiotic name to create tracks
    const tracks = new Map<string, TreatmentPeriod[]>();
    validTreatments.forEach((treatment) => {
      if (!tracks.has(treatment.antibioticName)) {
        tracks.set(treatment.antibioticName, []);
      }
      tracks.get(treatment.antibioticName)!.push(treatment);
    });

    // Sort tracks by earliest start date
    const sortedTracks = Array.from(tracks.entries()).sort((a, b) => {
      const aEarliest = Math.min(...a[1].map((t) => t.startDate.getTime()));
      const bEarliest = Math.min(...b[1].map((t) => t.startDate.getTime()));
      return aEarliest - bEarliest;
    });

    console.log("TimelineData calculated:", { minDate, maxDate, totalDays, tracksCount: sortedTracks.length, treatments: sortedTracks.map(([name, periods]) => ({ name, count: periods.length })) });

    return {
      minDate,
      maxDate,
      totalDays,
      tracks: sortedTracks,
    };
  }, [treatments]);

  // These are only used when timelineData is valid, but they must be called
  // on every render to maintain hook order consistency
  const { minDate = new Date(), maxDate = new Date(), totalDays = 0, tracks = [] } = timelineData || {};

  // Get all treatment start/end dates for x-axis markers
  const treatmentBoundaries = useMemo(() => {
    if (!timelineData) return [];
    
    const boundaries: { date: Date; position: number; type: 'start' | 'end'; antibioticName: string; label: string }[] = [];
    
    treatments.forEach((treatment) => {
      // Start date marker - at the beginning of the start date
      const startPosition = ((treatment.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays;
      boundaries.push({
        date: treatment.startDate,
        position: startPosition,
        type: 'start',
        antibioticName: treatment.antibioticName,
        label: treatment.startDate.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric" 
        }),
      });
      
      // End date marker - at the END of the end date (since dates are inclusive)
      // Add 1 to position the tick at the end of the inclusive end date
      const endDaysFromMin = (treatment.endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      const endPosition = (endDaysFromMin + 1) / totalDays;
      boundaries.push({
        date: treatment.endDate,
        position: endPosition,
        type: 'end',
        antibioticName: treatment.antibioticName,
        label: treatment.endDate.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric" 
        }),
      });
    });
    
    // Sort by position
    return boundaries.sort((a, b) => a.position - b.position);
  }, [treatments, minDate, totalDays, timelineData]);

  // Calculate total days for each antibiotic
  const antibioticTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    treatments.forEach((treatment) => {
      if (!totals[treatment.antibioticName]) {
        totals[treatment.antibioticName] = 0;
      }
      totals[treatment.antibioticName] += treatment.daysApplied;
    });
    return totals;
  }, [treatments]);

  // Generate time axis markers based on zoom level
  const timeAxisMarkers = useMemo(() => {
    if (!timelineData) return [];

    const markers: { date: Date; position: number; label: string; isMinor: boolean }[] = [];
    const startDate = new Date(minDate);
    const endDate = new Date(maxDate);

    // Set to start of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const current = new Date(startDate);

    if (zoomLevel === "day") {
      // Show every day
      while (current <= endDate) {
        const position = (current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays;
        markers.push({
          date: new Date(current),
          position: Math.min(position, 1),
          label: current.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
          isMinor: current.getDay() !== 1, // Monday is major
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (zoomLevel === "week") {
      // Show weekly markers (Mondays)
      // Move to next Monday
      while (current.getDay() !== 1) {
        current.setDate(current.getDate() + 1);
      }
      while (current <= endDate) {
        const position = (current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays;
        if (position >= 0 && position <= 1) {
          markers.push({
            date: new Date(current),
            position,
            label: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            isMinor: false,
          });
        }
        current.setDate(current.getDate() + 7);
      }
    } else {
      // Show monthly markers (1st of each month)
      current.setDate(1);
      current.setMonth(current.getMonth() + 1);
      while (current <= endDate) {
        const position = (current.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays;
        if (position >= 0 && position <= 1) {
          markers.push({
            date: new Date(current),
            position,
            label: current.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
            isMinor: false,
          });
        }
        current.setMonth(current.getMonth() + 1);
      }
    }

    return markers;
  }, [timelineData, minDate, maxDate, totalDays, zoomLevel]);

  // Extract key events from treatments
  const keyEvents = useMemo(() => {
    if (!timelineData) return [];

    const events: {
      date: Date;
      position: number;
      type: "start" | "pause" | "resume" | "finish" | "extend";
      antibioticName: string;
      description: string;
    }[] = [];

    treatments.forEach((treatment) => {
      // Start event
      const startPosition = (treatment.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays;
      events.push({
        date: treatment.startDate,
        position: startPosition,
        type: "start",
        antibioticName: treatment.antibioticName,
        description: `Started ${treatment.antibioticName}`,
      });

      // End/status event
      if (treatment.status === "finished") {
        const endPosition = ((treatment.endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) + 1) / totalDays;
        events.push({
          date: treatment.endDate,
          position: Math.min(endPosition, 1),
          type: "finish",
          antibioticName: treatment.antibioticName,
          description: `Completed ${treatment.antibioticName}`,
        });
      } else if (treatment.status === "suspended") {
        const endPosition = ((treatment.endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) + 1) / totalDays;
        events.push({
          date: treatment.endDate,
          position: Math.min(endPosition, 1),
          type: "pause",
          antibioticName: treatment.antibioticName,
          description: `Suspended ${treatment.antibioticName}`,
        });
      } else if (treatment.status === "extended") {
        const endPosition = ((treatment.endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) + 1) / totalDays;
        events.push({
          date: treatment.endDate,
          position: Math.min(endPosition, 1),
          type: "extend",
          antibioticName: treatment.antibioticName,
          description: `Extended ${treatment.antibioticName}`,
        });
      }
    });

    return events.sort((a, b) => a.position - b.position);
  }, [treatments, minDate, totalDays, timelineData]);

  // Now we can safely do conditional returns after all hooks are called
  if (!timelineData || timelineData.tracks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No treatment data to display</p>
      </Card>
    );
  }

  // Calculate position and width for each treatment period
  const calculatePosition = (startDate: Date, endDate: Date): React.CSSProperties => {
    // Guard against invalid dates or zero totalDays
    if (!startDate || !endDate || totalDays <= 0) {
      return {
        left: "0%",
        width: "0%",
        position: "absolute",
        display: "none",
      };
    }

    const start =
      (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

    const leftPercent = Math.max(0, Math.min(100, (start / totalDays) * 100));
    const widthPercent = Math.max(0.1, Math.min(100, (duration / totalDays) * 100));

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      position: "absolute",
    };
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Total Timeline
          </p>
          <p className="text-2xl font-bold text-foreground">{totalDays} days</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Active Antibiotics
          </p>
          <p className="text-2xl font-bold text-foreground">{tracks.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Total Treatments
          </p>
          <p className="text-2xl font-bold text-foreground">
            {treatments.length}
          </p>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card className="p-6">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Treatment Timeline
            </h3>
            <p className="text-sm text-muted-foreground">
              {minDate.toLocaleDateString()} - {maxDate.toLocaleDateString()}
            </p>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (zoomLevel === "month") setZoomLevel("week");
                  else if (zoomLevel === "week") setZoomLevel("day");
                }}
                disabled={zoomLevel === "day"}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (zoomLevel === "day") setZoomLevel("week");
                  else if (zoomLevel === "week") setZoomLevel("month");
                }}
                disabled={zoomLevel === "month"}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
            <Select value={zoomLevel} onValueChange={(v: ZoomLevel) => setZoomLevel(v)}>
              <SelectTrigger className="w-[120px] h-8">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Outer container with right padding for overflow space */}
        <div className="pr-12">
          {/* Time axis markers based on zoom level */}
          <div className="relative mb-1 border-b border-border h-8">
            {timeAxisMarkers.map((marker, index) => (
              <div
                key={`marker-${index}`}
                className={`absolute bottom-0 flex flex-col items-center ${marker.isMinor ? "opacity-50" : ""}`}
                style={{ left: `${marker.position * 100}%`, transform: "translateX(-50%)" }}
              >
                <span className={`text-[10px] whitespace-nowrap mb-0.5 ${marker.isMinor ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                  {marker.label}
                </span>
                <div className={`w-px ${marker.isMinor ? "h-1 bg-muted-foreground/30" : "h-2 bg-border"}`} />
              </div>
            ))}
          </div>

          {/* Key events row */}
          {keyEvents.length > 0 && (
            <div className="relative h-6 mb-2 border-b border-border/50">
              {keyEvents.map((event, index) => {
                const EventIcon = event.type === "start" ? Play
                  : event.type === "pause" ? Pause
                  : event.type === "finish" ? CheckCircle2
                  : TrendingUp;
                const eventColor = event.type === "start" ? "text-green-500"
                  : event.type === "pause" ? "text-red-500"
                  : event.type === "finish" ? "text-blue-500"
                  : "text-amber-500";

                return (
                  <div
                    key={`event-${index}`}
                    className="absolute top-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ left: `${event.position * 100}%`, transform: `translateX(-50%) translateY(-50%)` }}
                  >
                    <EventIcon className={`h-3.5 w-3.5 ${eventColor}`} />
                    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-lg group-hover:block z-20 border border-border">
                      <div className="font-medium">{event.description}</div>
                      <div className="text-muted-foreground">{event.date.toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Timeline tracks - inner container for percentage positioning */}
          <div className="space-y-4">
           {tracks.map(([antibioticName, periods]) => {
             const total = antibioticTotals[antibioticName];
             const antibioticType = periods[0].antibioticType;
             const colorScheme = antibioticColorMap.get(antibioticName) || ANTIBIOTIC_COLORS[0];

             return (
              <div key={antibioticName} className="space-y-2">
                {/* Track header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Color indicator */}
                    <div className={`w-3 h-3 rounded-full ${colorScheme.fill}`} />
                    <span className="text-sm font-medium text-foreground">
                      {antibioticName}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {antibioticType}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {total} days total
                  </span>
                </div>

                {/* Track visualization */}
                <div className="relative h-8 bg-muted/30 rounded">
                  {periods.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                      No periods
                    </div>
                  ) : (
                    periods.map((period) => {
                       const position = calculatePosition(
                         period.startDate,
                         period.endDate,
                       );

                       const isActive = period.status === "active";
                       const isFinished = period.status === "finished";
                       const isSuspended = period.status === "suspended";
                       const isExtended = period.status === "extended";

                       // Calculate progress percentage (daysApplied / programmedDays)
                       const progressPercent = period.programmedDays > 0
                         ? (period.daysApplied / period.programmedDays) * 100
                         : 0;

                       // Status indicator style
                       const statusIndicator = isActive ? "ring-2 ring-blue-400 ring-offset-1"
                         : isSuspended ? "ring-2 ring-red-400 ring-offset-1"
                         : isExtended ? "ring-2 ring-amber-400 ring-offset-1"
                         : "";

                       return (
                         <div
                           key={period.id}
                           className={`absolute top-1 h-6 rounded border ${colorScheme.border} ${colorScheme.bg} ${statusIndicator} group cursor-pointer transition-all hover:ring-2 hover:ring-foreground/50 relative overflow-hidden`}
                           style={position}
                           title={`${antibioticName}: ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()} (${period.daysApplied}/${period.programmedDays} days) - ${period.status}`}
                         >
                           {/* Progress fill overlay */}
                           <div
                             className={`absolute inset-y-0 left-0 ${colorScheme.fill} opacity-80 transition-all duration-300`}
                             style={{ width: `${progressPercent}%` }}
                           />

                           {/* Tooltip on hover */}
                           <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg group-hover:block z-10">
                             <div className="font-semibold">{antibioticName}</div>
                             <div>
                               {period.startDate.toLocaleDateString()} -{" "}
                               {period.endDate.toLocaleDateString()}
                             </div>
                             <div className="font-medium">
                               {period.daysApplied} / {period.programmedDays} days
                             </div>
                             <div className="text-[11px] mt-1">
                               {progressPercent.toFixed(0)}% complete
                             </div>
                             <Badge
                               variant={isActive ? "default" : "outline"}
                               className="mt-2"
                             >
                               {period.status}
                             </Badge>
                           </div>

                           {/* Status text overlay - position relative to progress bar */}
                           <div className="absolute inset-0 flex items-center px-1 z-10">
                             <span className="text-[10px] font-bold text-foreground">
                               {isActive && "●"}
                               {isFinished && "✓"}
                               {isSuspended && <X className="h-2.5 w-2.5 stroke-[3]" />}
                               {isExtended && <TrendingUp className="h-2.5 w-2.5 stroke-[3]" />}
                             </span>
                             {progressPercent > 0 && (
                               <span className="text-[9px] font-semibold text-foreground ml-auto">
                                 {progressPercent.toFixed(0)}%
                               </span>
                             )}
                           </div>
                         </div>
                       );
                     })
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div> {/* Close pr-12 wrapper */}
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Antibiotic Colors */}
          <div className="pb-3 border-b border-border">
            <p className="font-medium text-foreground text-sm mb-2">Antibiotic Colors:</p>
            <div className="flex flex-wrap gap-3">
              {tracks.map(([antibioticName]) => {
                const color = antibioticColorMap.get(antibioticName);
                return (
                  <div key={antibioticName} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${color?.fill || "bg-gray-400"}`} />
                    <span className="text-xs text-muted-foreground">{antibioticName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Visualization */}
          <div className="pb-3 border-b border-border">
            <p className="font-medium text-foreground text-sm mb-2">Progress Visualization:</p>
            <p className="text-xs text-muted-foreground mb-2">Light background shows total programmed duration. Colored fill shows actual progress.</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-4 rounded border border-blue-300 bg-blue-100 dark:bg-blue-900/50 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-blue-500 opacity-80" style={{ width: "60%" }}></div>
              </div>
              <span className="text-xs text-muted-foreground">60% Complete</span>
            </div>
          </div>

          {/* Key Events */}
          <div className="pb-3 border-b border-border">
            <p className="font-medium text-foreground text-sm mb-2">Timeline Events:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <Play className="h-3.5 w-3.5 text-green-500" />
                <span className="text-muted-foreground text-xs">Started</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-muted-foreground text-xs">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <Pause className="h-3.5 w-3.5 text-red-500" />
                <span className="text-muted-foreground text-xs">Suspended</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-muted-foreground text-xs">Extended</span>
              </div>
            </div>
          </div>

          {/* Status Ring Indicators */}
          <div>
            <p className="font-medium text-foreground text-sm mb-2">Status Ring Indicators:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-8 rounded bg-muted ring-2 ring-blue-400 ring-offset-1" />
                <span className="text-muted-foreground text-xs">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-8 rounded bg-muted border border-border" />
                <span className="text-muted-foreground text-xs">Finished</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-8 rounded bg-muted ring-2 ring-red-400 ring-offset-1" />
                <span className="text-muted-foreground text-xs">Suspended</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-8 rounded bg-muted ring-2 ring-amber-400 ring-offset-1" />
                <span className="text-muted-foreground text-xs">Extended</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
