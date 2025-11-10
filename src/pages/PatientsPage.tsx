import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router";
import { CustomHeader } from "@/components/patients/CustomHeader";
import { PatientsFilter } from "@/components/patients/patientsFilters/PatientsFilter";
import { mockPatients } from "@/services/MockApi";
import { EditPatient } from "@/components/patients/EditPatient";
import { PatientResumeCard } from "@/components/patients/PatientResumeCard";
import { type Bed, type Unit, type ActiveBed } from "@/models/Units";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PatientFilterProvider,
  usePatientFilter,
} from "@/components/patients/context/PatientFilterContext";
import type { Patient } from "@/models/Patients";

export function PatientsPageContent() {
  // const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const handleEditPatient = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) setEditingPatient(patient);
  };

  const handleSave = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPatient(null);
  };

  const { searchQuery, selectedUnit, selectedBed, showOnlyAlerts } =
    usePatientFilter();

  //TODO: finish this implementation of mocks
  //GET data from the API (mock data for now)
  const { data: units } = useMockUnitsQuery();
  const { data: patients } = useMockPatientsQuery();

  // obtain active beds with patients
  const activeBeds =
    units?.flatMap((unit: Unit) =>
      unit.beds
        .filter((bed: Bed) => bed.patientRut)
        .map((bed) => ({
          ...bed,
          unitName: unit.name,
          patient: patients?.find((p) => p.rut === bed.patientRut),
        })),
    ) ?? [];

  const filteredActiveBeds = activeBeds.filter((bed: ActiveBed) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      bed.patient?.name.toLowerCase().includes(query) ||
      bed.patient?.rut.toLowerCase().includes(query);
    bed.patient?.age.toString().toLowerCase().includes(query);
    const matchesUnit = selectedUnit === "all" || bed.unitName === selectedUnit;
    return matchesSearch && matchesUnit;
  });

  const getRoundedClass = (length: number, index: number) => {
    if (index === 0) {
      return "rounded-t-m rounded-b-none";
    } else if (index === length - 1) {
      return "rounded-t-none rounded-b-m ";
    } else {
      return "rounded-none";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CustomHeader />
        <PatientsFilter />

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredActiveBeds.length}{" "}
          {filteredActiveBeds.length === 1 ? "patient" : "patients"} found
        </div>

        {/* Patients List */}
        <div className="space-y-3">
          {filteredActiveBeds.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No patients found matching your search.
              </p>
            </Card>
          ) : (
            filteredActiveBeds.map((bed: ActiveBed, index: number) => (
              <Link key={bed.patientRut} to={`/patients/${bed.patient.rut}`}>
                <PatientResumeCard
                  patient={bed.patient}
                  className={getRoundedClass(filteredActiveBeds.length, index)}
                  handleEditPatient={handleEditPatient}
                />
              </Link>
            ))
          )}
        </div>

        <Dialog
          open={!!editingPatient}
          onOpenChange={() => setEditingPatient(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Patient</DialogTitle>
            </DialogHeader>
            {editingPatient && (
              <EditPatient patient={editingPatient} onSave={handleSave} />
            )}
          </DialogContent>
        </Dialog>
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
