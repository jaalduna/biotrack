import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { UserHeader } from "@/components/UserHeader";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { CustomHeader } from "@/components/patients/CustomHeader";
import { PatientsFilter } from "@/components/patients/patientsFilters/PatientsFilter";
import { patientsApi } from "@/services/Api";
import { EditPatient } from "@/components/patients/EditPatient";
import { PatientResumeCard } from "@/components/patients/PatientResumeCard";
import { CreatePatientDialog } from "@/components/patients/CreatePatientDialog";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If user doesn't have a team, show message and button to create one
  if (user && !user.team_id) {
    return (
      <div className="min-h-screen bg-background">
        <EmailVerificationBanner />
        <UserHeader />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Card className="p-12">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">Welcome to BioTrack!</h2>
              <p className="text-muted-foreground">
                You need to create a team first to start managing patients.
              </p>
              <Button 
                onClick={() => navigate("/team/setup")}
                size="lg"
              >
                Create Your Team
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Load patients from API on mount
  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const data = await patientsApi.getAll();
        setPatients(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load patients");
        console.error("Error loading patients:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  const handleEditPatient = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) setEditingPatient(patient);
  };

  const handleSave = async (updated: Patient) => {
    try {
      await patientsApi.update(updated.id, updated);
      setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingPatient(null);
    } catch (err) {
      console.error("Error updating patient:", err);
      alert("Failed to update patient");
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const data = await patientsApi.getAll();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh patients");
      console.error("Error refreshing patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (newPatient: Omit<Patient, "id">) => {
    const created = await patientsApi.create(newPatient);
    setPatients((prev) => [...prev, created]);
  };

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
      <EmailVerificationBanner />
      <UserHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <CustomHeader />
        
        {/* Action Buttons Row */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="gap-2"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate("/settings")}
              className="gap-2"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
          
          <CreatePatientDialog onCreatePatient={handleCreatePatient} existingPatients={patients} />
        </div>
        
        <PatientsFilter />

        {/* Loading State */}
        {loading && (
          <Card className="p-12 text-center">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading patients...</p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-12 text-center border-red-200 bg-red-50">
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="mt-4"
            >
              Try Again
            </Button>
          </Card>
        )}

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-2 text-sm text-muted-foreground">
            {filteredPatients.length}{" "}
            {filteredPatients.length === 1 ? "patient" : "patients"} found
          </div>
        )}

        {/* Patients List */}
        {!loading && !error && (
          <div className="space-y-2">
            {filteredPatients.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  No patients found matching your search.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    // This will be handled by PatientsFilter's clearFilters
                    window.location.reload();
                  }}
                  className="mt-4"
                >
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              filteredPatients.map((patient, index) => (
                <Link key={patient.id} to={`/patients/${patient.rut}`}>
                  <PatientResumeCard
                    patient={patient}
                    className={getRoundedClass(filteredPatients.length, index)}
                    handleEditPatient={handleEditPatient}
                  />
                </Link>
              ))
            )}
          </div>
        )}

        <Dialog
          open={!!editingPatient}
          onOpenChange={() => setEditingPatient(null)}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Patient</DialogTitle>
            </DialogHeader>
            {editingPatient && (
              <EditPatient 
                patient={editingPatient} 
                onSave={handleSave}
                allPatients={patients}
              />
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
