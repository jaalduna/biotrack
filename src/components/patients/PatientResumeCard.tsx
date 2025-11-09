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
  return (
    <Card
      className={`flex flex-col gap-4 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between cursor-pointer ${className}`}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-[120px]">
          <p className="text-xs font-medium text-muted-foreground">
            Unit / Bed
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{patient.unit}</Badge>
            <span className="text-sm font-semibold text-foreground">
              Bed {patient.bedNumber}
            </span>
          </div>
        </div>

        <div className="min-w-[140px]">
          <p className="text-xs font-medium text-muted-foreground">RUT</p>
          <p className="font-mono text-sm font-medium text-foreground">
            {patient.rut}
          </p>
        </div>

        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Patient Name
          </p>
          <p className="text-base font-semibold text-foreground">
            {patient.name}
          </p>
        </div>

        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Patient age
          </p>
          <p className="font-mono text-sm font-medium text-foreground">
            {patient.age}
          </p>
        </div>

        <div className="min-w-[180px]">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusConfig[patient.status].variant}>
              {statusConfig[patient.status].label}
            </Badge>
            {patient.hasEndingSoonProgram && (
              <Badge variant="destructive" className="bg-orange-500">
                1 Day Left
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent"
          onClick={(e) => {
            e.preventDefault();
            handleEditPatient(patient.id);
          }}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </div>
    </Card>
  );
};
