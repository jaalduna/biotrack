import { useEffect, useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router";
import { CustomHeader } from "@/components/patients/CustomHeader";
import { PatientsFilter } from "@/components/patients/patientsFilters/PatientsFilter";
import {
  mockPatients,
  type Patient,
  type PatientStatus,
} from "@/services/MockApi";
import {
  PatientFilterProvider,
  usePatientFilter,
} from "@/components/patients/context/PatientFilterContext";

const statusConfig: Record<
  PatientStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  waiting: { label: "Waiting for Treatment", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  archived: { label: "Archived", variant: "outline" },
};

export function PatientsPageContent() {
  // const [searchQuery, setSearchQuery] = useState("");
  const [patients] = useState<Patient[]>(mockPatients);

  const { searchQuery, selectedUnit, selectedBed, showOnlyAlerts } =
    usePatientFilter();

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      patient.name.toLowerCase().includes(query) ||
      patient.rut.toLowerCase().includes(query);
    const matchesUnit = selectedUnit === "all" || patient.unit === selectedUnit;
    const matchesBed =
      selectedBed === "all" ||
      patient.bedNumber === Number.parseInt(selectedBed);
    const matchesAlert = !showOnlyAlerts || patient.hasEndingSoonProgram;
    return matchesSearch && matchesUnit && matchesBed && matchesAlert;
  });

  //TODO: create on its own component
  const handleEditPatient = (patientId: string) => {
    console.log("[v0] Edit patient clicked:", patientId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CustomHeader />
        <PatientsFilter />

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredPatients.length}{" "}
          {filteredPatients.length === 1 ? "patient" : "patients"} found
        </div>

        {/* Patients List */}
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No patients found matching your search.
              </p>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Link key={patient.id} to={`/patients/${patient.rut}`}>
                <Card className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between cursor-pointer">
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
                      <p className="text-xs font-medium text-muted-foreground">
                        RUT
                      </p>
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

                    <div className="min-w-[180px]">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusConfig[patient.status].variant}>
                          {statusConfig[patient.status].label}
                        </Badge>
                        {patient.hasEndingSoonProgram && (
                          <Badge
                            variant="destructive"
                            className="bg-orange-500"
                          >
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
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function PatientsPage() {
  return (
    <PatientFilterProvider>
      <PatientsPageContent />
    </PatientFilterProvider>
  );
}
