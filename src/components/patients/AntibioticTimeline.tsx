import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp } from "lucide-react";

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

export function AntibioticTimeline({ treatments }: AntibioticTimelineProps) {
  // IMPORTANT: All hooks must be called at the top level before any conditional returns
  // This follows React's Rules of Hooks
  
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
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">
            Treatment Timeline
          </h3>
          <p className="text-sm text-muted-foreground">
            {minDate.toLocaleDateString()} - {maxDate.toLocaleDateString()}
          </p>
        </div>

        {/* Outer container with right padding for overflow space */}
        <div className="pr-12">
          {/* Time markers - inner container for percentage positioning */}
          <div className="relative mb-1 border-b border-border h-10">
            {/* Treatment start/end ticks and date labels (always 45 degrees) */}
            {treatmentBoundaries.map((boundary, index) => (
              <div
                key={`boundary-${index}`}
                className="absolute bottom-0 flex flex-col items-start"
                style={{ left: `${boundary.position * 100}%` }}
                title={`${boundary.antibioticName} ${boundary.type === 'start' ? 'starts' : 'ends'}: ${boundary.date.toLocaleDateString()}`}
              >
                {/* Date label rotated 45 degrees */}
                <span 
                  className={`text-[10px] whitespace-nowrap origin-bottom-left mb-0.5 ${boundary.type === 'start' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400'}`}
                  style={{ transform: 'rotate(-45deg) translateY(-100%)' }}
                >
                  {boundary.label}
                </span>
                {/* Tick mark below the label */}
                <div className={`w-0.5 h-2 ${boundary.type === 'start' ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
            ))}
          </div>

          {/* Timeline tracks - inner container for percentage positioning */}
          <div className="space-y-4">
           {tracks.map(([antibioticName, periods]) => {
             const total = antibioticTotals[antibioticName];
             const antibioticType = periods[0].antibioticType;
             
             console.log(`Rendering antibiotic ${antibioticName}:`, { periodsCount: periods.length, total });

             return (
              <div key={antibioticName} className="space-y-2">
                {/* Track header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                <div className="relative h-6">
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

                       // Status-based colors (darker for progress, lighter for background)
                       const statusColor = isActive
                         ? { dark: "bg-blue-500", light: "bg-blue-200 dark:bg-blue-900" }
                         : isFinished
                           ? { dark: "bg-green-500", light: "bg-green-200 dark:bg-green-900" }
                           : isSuspended
                             ? { dark: "bg-red-500", light: "bg-red-200 dark:bg-red-900" }
                             : { dark: "bg-yellow-500", light: "bg-yellow-200 dark:bg-yellow-900" }; // extended

                       // Calculate progress percentage (daysApplied / programmedDays)
                       const progressPercent = period.programmedDays > 0 
                         ? (period.daysApplied / period.programmedDays) * 100 
                         : 0;

                       return (
                         <div
                           key={period.id}
                           className={`absolute top-1 h-4 rounded ${statusColor.light} group cursor-pointer transition-all hover:ring-2 hover:ring-foreground relative`}
                           style={position}
                           title={`${antibioticName}: ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()} (${period.daysApplied}/${period.programmedDays} days) - ${period.status}`}
                         >
                           {/* Progress fill overlay */}
                           <div 
                             className={`absolute inset-y-0 left-0 rounded-l ${statusColor.dark} transition-all duration-300`}
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
        <div className="space-y-3">
          <div className="mb-3 pb-3 border-b border-border">
            <p className="font-medium text-foreground text-sm mb-2">Progress Visualization:</p>
            <p className="text-xs text-muted-foreground mb-2">Light background shows total programmed duration. Colored fill shows actual progress (daysApplied / programmedDays).</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 rounded bg-blue-200 dark:bg-blue-900 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-blue-500" style={{ width: "60%" }}></div>
              </div>
              <span className="text-xs text-muted-foreground">60% Complete</span>
            </div>
          </div>

          <div>
            <p className="font-medium text-foreground text-sm mb-2">Status Indicators:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-4 w-8 rounded bg-blue-200 dark:bg-blue-900 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                  ●
                </div>
                <span className="text-muted-foreground text-xs">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-4 w-8 rounded bg-green-200 dark:bg-green-900 text-[12px] text-green-600 dark:text-green-400 font-bold">
                  ✓
                </div>
                <span className="text-muted-foreground text-xs">Finished</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-4 w-8 rounded bg-red-200 dark:bg-red-900 text-red-600 dark:text-red-400">
                  <X className="h-3 w-3 stroke-[3]" />
                </div>
                <span className="text-muted-foreground text-xs">Suspended</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-4 w-8 rounded bg-yellow-200 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400">
                  <TrendingUp className="h-3 w-3 stroke-[3]" />
                </div>
                <span className="text-muted-foreground text-xs">Extended</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
