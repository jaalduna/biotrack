import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pause,
  Play,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Pill,
  Clock,
} from "lucide-react";
import type { Treatment } from "@/services/Api";

interface ActivityEvent {
  id: string;
  type: "created" | "started" | "day_applied" | "suspended" | "resumed" | "extended" | "completed";
  treatmentId: string;
  antibioticName: string;
  antibioticType: "antibiotic" | "corticoide";
  timestamp: Date;
  description: string;
  details?: string;
}

interface TreatmentActivityLogProps {
  treatments: Treatment[];
  maxEvents?: number;
}

const EVENT_ICONS: Record<ActivityEvent["type"], React.ComponentType<{ className?: string }>> = {
  created: Plus,
  started: Play,
  day_applied: Calendar,
  suspended: Pause,
  resumed: Play,
  extended: TrendingUp,
  completed: CheckCircle2,
};

const EVENT_COLORS: Record<ActivityEvent["type"], string> = {
  created: "text-blue-500 bg-blue-500/10",
  started: "text-green-500 bg-green-500/10",
  day_applied: "text-violet-500 bg-violet-500/10",
  suspended: "text-red-500 bg-red-500/10",
  resumed: "text-emerald-500 bg-emerald-500/10",
  extended: "text-amber-500 bg-amber-500/10",
  completed: "text-green-600 bg-green-600/10",
};

export function TreatmentActivityLog({ treatments, maxEvents = 20 }: TreatmentActivityLogProps) {
  // Generate activity events from treatments
  const activityEvents = useMemo(() => {
    const events: ActivityEvent[] = [];

    treatments.forEach((treatment) => {
      const createdAt = new Date(treatment.createdAt);
      const updatedAt = new Date(treatment.updatedAt);
      const startDate = new Date(treatment.startDate);

      // Treatment created event
      events.push({
        id: `${treatment.id}-created`,
        type: "created",
        treatmentId: treatment.id,
        antibioticName: treatment.antibioticName,
        antibioticType: treatment.antibioticType,
        timestamp: createdAt,
        description: `Treatment created`,
        details: `${treatment.antibioticName} - ${treatment.programmedDays} days programmed`,
      });

      // Treatment started event (if start date is different from created date)
      if (startDate.toDateString() !== createdAt.toDateString()) {
        events.push({
          id: `${treatment.id}-started`,
          type: "started",
          treatmentId: treatment.id,
          antibioticName: treatment.antibioticName,
          antibioticType: treatment.antibioticType,
          timestamp: startDate,
          description: `Treatment started`,
          details: `${treatment.antibioticName} began`,
        });
      }

      // Generate day applied events based on daysApplied
      // These are simulated based on start date + days
      if (treatment.daysApplied > 0) {
        for (let day = 1; day <= treatment.daysApplied; day++) {
          const dayDate = new Date(startDate);
          dayDate.setDate(dayDate.getDate() + day - 1);

          // Only add if it's not in the future
          if (dayDate <= new Date()) {
            events.push({
              id: `${treatment.id}-day-${day}`,
              type: "day_applied",
              treatmentId: treatment.id,
              antibioticName: treatment.antibioticName,
              antibioticType: treatment.antibioticType,
              timestamp: dayDate,
              description: `Day ${day} applied`,
              details: `${treatment.antibioticName} - Day ${day}/${treatment.programmedDays}`,
            });
          }
        }
      }

      // Status-based events
      if (treatment.status === "suspended") {
        events.push({
          id: `${treatment.id}-suspended`,
          type: "suspended",
          treatmentId: treatment.id,
          antibioticName: treatment.antibioticName,
          antibioticType: treatment.antibioticType,
          timestamp: updatedAt,
          description: `Treatment suspended`,
          details: `${treatment.antibioticName} paused at day ${treatment.daysApplied}`,
        });
      } else if (treatment.status === "extended") {
        events.push({
          id: `${treatment.id}-extended`,
          type: "extended",
          treatmentId: treatment.id,
          antibioticName: treatment.antibioticName,
          antibioticType: treatment.antibioticType,
          timestamp: updatedAt,
          description: `Treatment extended`,
          details: `${treatment.antibioticName} extended beyond ${treatment.programmedDays} days`,
        });
      } else if (treatment.status === "finished") {
        // Calculate finish date
        const finishDate = new Date(startDate);
        finishDate.setDate(finishDate.getDate() + treatment.daysApplied - 1);

        events.push({
          id: `${treatment.id}-completed`,
          type: "completed",
          treatmentId: treatment.id,
          antibioticName: treatment.antibioticName,
          antibioticType: treatment.antibioticType,
          timestamp: finishDate,
          description: `Treatment completed`,
          details: `${treatment.antibioticName} - ${treatment.daysApplied} days total`,
        });
      }
    });

    // Sort by timestamp (most recent first)
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxEvents);
  }, [treatments, maxEvents]);

  // Group events by date for better visualization
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, ActivityEvent[]>();

    activityEvents.forEach((event) => {
      const dateKey = event.timestamp.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    return Array.from(groups.entries());
  }, [activityEvents]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (treatments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>Treatment activity history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No treatment activity yet</p>
            <p className="text-sm mt-1">Add treatments to see activity history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Recent treatment activity ({activityEvents.length} events)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto pr-2">
          <div className="space-y-6">
            {groupedEvents.map(([dateKey, events]) => (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground px-2">
                    {dateKey} · {getRelativeTime(events[0].timestamp)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Events for this date */}
                <div className="space-y-3">
                  {events.map((event) => {
                    const Icon = EVENT_ICONS[event.type];
                    const colorClass = EVENT_COLORS[event.type];

                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Icon */}
                        <div className={`p-2 rounded-full ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {event.description}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {event.antibioticType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {event.details}
                          </p>
                        </div>

                        {/* Time */}
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
