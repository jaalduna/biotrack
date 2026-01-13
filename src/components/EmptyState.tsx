import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Plus,
  FileQuestion,
  Inbox,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actions,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "p-8" : "p-12",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          compact ? "h-12 w-12 mb-3" : "h-16 w-16 mb-4"
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground",
            compact ? "h-6 w-6" : "h-8 w-8"
          )}
        />
      </div>

      <h3
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-base mb-1" : "text-lg mb-2"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "text-muted-foreground max-w-sm",
          compact ? "text-sm mb-4" : "text-base mb-6"
        )}
      >
        {description}
      </p>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || (index === 0 ? "default" : "outline")}
                onClick={action.onClick}
                size={compact ? "sm" : "default"}
              >
                {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// Pre-configured empty states for common scenarios
export function NoPatientsEmptyState({
  onCreatePatient,
}: {
  onCreatePatient: () => void;
}) {
  return (
    <EmptyState
      icon={Users}
      title="No patients yet"
      description="Get started by adding your first patient. You can track their treatments, diagnostics, and progress all in one place."
      actions={[
        {
          label: "Add First Patient",
          onClick: onCreatePatient,
          icon: Plus,
        },
      ]}
    />
  );
}

export function NoSearchResultsEmptyState({
  onClearFilters,
  searchQuery,
}: {
  onClearFilters: () => void;
  searchQuery?: string;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No patients found"
      description={
        searchQuery
          ? `No patients match "${searchQuery}". Try adjusting your search or filters.`
          : "No patients match your current filters. Try adjusting or clearing them."
      }
      actions={[
        {
          label: "Clear Filters",
          onClick: onClearFilters,
          variant: "outline",
        },
      ]}
    />
  );
}

export function NoTreatmentsEmptyState({
  onAddTreatment,
}: {
  onAddTreatment?: () => void;
}) {
  return (
    <EmptyState
      icon={Inbox}
      title="No active treatments"
      description="This patient doesn't have any active treatment programs. Add a treatment to start tracking."
      actions={
        onAddTreatment
          ? [
              {
                label: "Add Treatment",
                onClick: onAddTreatment,
                icon: Plus,
              },
            ]
          : undefined
      }
      compact
    />
  );
}

export function NoDiagnosticsEmptyState({
  onAddDiagnostic,
}: {
  onAddDiagnostic?: () => void;
}) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No diagnostics recorded"
      description="Add diagnostic information to track this patient's conditions and severity levels."
      actions={
        onAddDiagnostic
          ? [
              {
                label: "Add Diagnostic",
                onClick: onAddDiagnostic,
                icon: Plus,
              },
            ]
          : undefined
      }
      compact
    />
  );
}
