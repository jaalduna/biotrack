import { useState, useEffect } from "react";
import { Edit, Pill, AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { treatmentsApi } from "@/services/Api";
import type { Patient, PatientStatus } from "@/models/Patients";

const statusConfig: Record<
  PatientStatus,
  { label: string; variant: "default" | "secondary" | "outline"; color: string }
> = {
  waiting: { label: "Waiting", variant: "secondary", color: "bg-slate-500" },
  active: { label: "Active", variant: "default", color: "bg-green-500" },
  archived: { label: "Archived", variant: "outline", color: "bg-gray-400" },
};

// Generate consistent color from patient name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-emerald-500",
    "bg-violet-500",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface TreatmentSummary {
  activeTreatments: number;
  endingSoon: number;
  avgProgress: number;
}

export interface PatientParams {
  patient: Patient;
  className: string;
  handleEditPatient: (patientId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (patient: Patient) => void;
}

export const PatientResumeCard = ({
  patient,
  className,
  handleEditPatient,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: PatientParams) => {
  const [treatmentSummary, setTreatmentSummary] = useState<TreatmentSummary | null>(null);
  const hasAlert = patient.hasEndingSoonProgram || (treatmentSummary?.endingSoon ?? 0) > 0;
  const avatarColor = getAvatarColor(patient.name);
  const initials = getInitials(patient.name);

  useEffect(() => {
    async function loadTreatmentSummary() {
      try {
        const treatments = await treatmentsApi.getByPatientId(patient.id);
        const activeTreatments = treatments.filter(t => t.status === "active");
        const endingSoon = activeTreatments.filter(
          t => t.programmedDays - t.daysApplied <= 2
        ).length;
        const avgProgress = activeTreatments.length > 0
          ? activeTreatments.reduce(
              (acc, t) => acc + (t.daysApplied / t.programmedDays) * 100,
              0
            ) / activeTreatments.length
          : 0;

        setTreatmentSummary({
          activeTreatments: activeTreatments.length,
          endingSoon,
          avgProgress: Math.round(avgProgress),
        });
      } catch {
        // Silently fail - treatment info is optional
      }
    }
    loadTreatmentSummary();
  }, [patient.id]);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(patient);
  };

  return (
    <Card
      className={cn(
        "group p-3 sm:p-4 transition-all hover:bg-muted/50 hover:shadow-md cursor-pointer",
        hasAlert && "border-l-4 border-l-orange-500",
        isSelected && "ring-2 ring-primary bg-primary/5",
        className
      )}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-center sm:gap-4">
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="shrink-0" onClick={handleCheckboxClick}>
            <Checkbox
              checked={isSelected}
              className="h-5 w-5"
            />
          </div>
        )}

        {/* Avatar */}
        <div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 transition-opacity",
            avatarColor,
            isSelected && "ring-2 ring-primary ring-offset-2"
          )}
        >
          {initials}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-foreground truncate">
              {patient.name}
            </p>
            <span className="text-sm text-muted-foreground">{patient.age}y</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{patient.rut}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="font-medium">
            {patient.unit}
          </Badge>
          <div className="px-2 py-1 bg-muted rounded text-sm font-semibold">
            Bed {patient.bedNumber}
          </div>
        </div>

        {/* Treatment Summary */}
        {treatmentSummary && treatmentSummary.activeTreatments > 0 && (
          <div className="hidden lg:flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg shrink-0">
            <div className="flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {treatmentSummary.activeTreatments}
              </span>
            </div>
            <div className="w-20">
              <Progress value={treatmentSummary.avgProgress} className="h-1.5" />
              <span className="text-xs text-muted-foreground">
                {treatmentSummary.avgProgress}% avg
              </span>
            </div>
          </div>
        )}

        {/* Status & Alerts */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={statusConfig[patient.status].variant}>
            {statusConfig[patient.status].label}
          </Badge>
          {hasAlert && (
            <Badge variant="destructive" className="bg-orange-500 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {treatmentSummary?.endingSoon || 1}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              handleEditPatient(patient.id);
            }}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox (mobile) */}
          {isSelectionMode && (
            <div className="shrink-0 pt-0.5" onClick={handleCheckboxClick}>
              <Checkbox
                checked={isSelected}
                className="h-5 w-5"
              />
            </div>
          )}

          {/* Avatar */}
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0",
              avatarColor,
              isSelected && "ring-2 ring-primary ring-offset-1"
            )}
          >
            {initials}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground truncate">
                  {patient.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {patient.rut} · {patient.age}y
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  handleEditPatient(patient.id);
                }}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {patient.unit}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                Bed {patient.bedNumber}
              </span>
              <Badge variant={statusConfig[patient.status].variant} className="text-xs">
                {statusConfig[patient.status].label}
              </Badge>
              {hasAlert && (
                <Badge variant="destructive" className="bg-orange-500 text-xs gap-0.5">
                  <AlertTriangle className="h-3 w-3" />
                  {treatmentSummary?.endingSoon || 1}
                </Badge>
              )}
            </div>

            {/* Treatment Progress (mobile) */}
            {treatmentSummary && treatmentSummary.activeTreatments > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <div className="flex items-center gap-1">
                    <Pill className="h-3 w-3" />
                    <span>{treatmentSummary.activeTreatments} active treatments</span>
                  </div>
                  <span>{treatmentSummary.avgProgress}%</span>
                </div>
                <Progress value={treatmentSummary.avgProgress} className="h-1" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
