import { Edit } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import type { Patient, PatientStatus } from "@/models/Patients";

const statusConfig: Record<
  PatientStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  waiting: { label: "Waiting for Treatment", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  archived: { label: "Archived", variant: "outline" },
};

export interface PatientParams {
  patient: Patient;
  className: string;
  handleEditPatient: (patientId: string) => void;
}
export const PatientResumeCard = ({
  patient,
  className,
  handleEditPatient,
}: PatientParams) => {
  const hasAlert = patient.hasEndingSoonProgram;
  
  return (
    <Card
      className={`p-3 sm:p-4 transition-colors hover:bg-muted/50 cursor-pointer ${
        hasAlert ? "border-l-4 border-l-orange-500" : ""
      } ${className}`}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground truncate">
            {patient.name}
          </p>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm font-medium text-foreground">{patient.age}y</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{patient.unit}</Badge>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            Bed {patient.bedNumber}
          </span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="font-mono text-sm text-muted-foreground">
            {patient.rut}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig[patient.status].variant}>
            {statusConfig[patient.status].label}
          </Badge>
          {hasAlert && (
            <Badge variant="destructive" className="bg-orange-500">
              1 Day Left
            </Badge>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent shrink-0"
          onClick={(e) => {
            e.preventDefault();
            handleEditPatient(patient.id);
          }}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground mb-1">
              {patient.name}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{patient.unit}</Badge>
              <span>·</span>
              <span>Bed {patient.bedNumber}</span>
              <span>·</span>
              <span>{patient.age}y</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 bg-transparent shrink-0"
            onClick={(e) => {
              e.preventDefault();
              handleEditPatient(patient.id);
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusConfig[patient.status].variant}>
              {statusConfig[patient.status].label}
            </Badge>
            {hasAlert && (
              <Badge variant="destructive" className="bg-orange-500">
                1 Day Left
              </Badge>
            )}
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {patient.rut}
          </span>
        </div>
      </div>
    </Card>
  );
};
