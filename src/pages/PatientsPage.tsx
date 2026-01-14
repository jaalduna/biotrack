import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Filter, CheckSquare, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { CustomHeader } from "@/components/patients/CustomHeader";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { PatientsFilter } from "@/components/patients/patientsFilters/PatientsFilter";
import { patientsApi } from "@/services/Api";
import { EditPatient } from "@/components/patients/EditPatient";
import { PatientResumeCard } from "@/components/patients/PatientResumeCard";
import { CreatePatientDialog } from "@/components/patients/CreatePatientDialog";
import { MobileFilterDrawer } from "@/components/MobileFilterDrawer";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { BulkActionsToolbar } from "@/components/patients/BulkActionsToolbar";
import {
  NoPatientsEmptyState,
  NoSearchResultsEmptyState,
} from "@/components/EmptyState";
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

// Keyboard shortcuts configuration
const keyboardShortcuts = [
  { key: "n", description: "New patient" },
  { key: "r", description: "Refresh patients" },
  { key: "s", description: "Focus search", alt: true },
];

export function PatientsPageContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);

  // Pull-to-refresh callback
  const handlePullRefresh = useCallback(async () => {
    try {
      const data = await patientsApi.getAll();
      setPatients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh patients");
    }
  }, []);

  // Pull-to-refresh hook
  const { isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    disabled: loading,
  });

  // If user doesn't have a team, show message and button to create one
  if (user && !user.team_id) {
    return (
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

  // Bulk selection handlers
  const handlePatientSelect = useCallback((patient: Patient) => {
    setSelectedPatients((prev) => {
      const isSelected = prev.some((p) => p.id === patient.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== patient.id);
      }
      return [...prev, patient];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedPatients([]);
    setIsSelectionMode(false);
  }, []);

  const handleBulkStatusChange = async (
    patientIds: string[],
    status: "waiting" | "active" | "archived"
  ) => {
    try {
      await Promise.all(
        patientIds.map((id) => {
          const patient = patients.find((p) => p.id === id);
          if (patient) {
            return patientsApi.update(id, { ...patient, status });
          }
          return Promise.resolve();
        })
      );
      // Refresh the patients list
      const data = await patientsApi.getAll();
      setPatients(data);
    } catch (error) {
      console.error("Error updating patients:", error);
      throw error;
    }
  };

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    if (isSelectionMode) {
      setSelectedPatients([]);
    }
  }, [isSelectionMode]);

  // Focus search input helper
  const focusSearchInput = useCallback(() => {
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      handler: () => setCreateDialogOpen(true),
      description: "New patient",
    },
    {
      key: "r",
      handler: handleRefresh,
      description: "Refresh patients",
    },
    {
      key: "s",
      alt: true,
      handler: focusSearchInput,
      description: "Focus search",
    },
  ]);

  const {
    searchQuery,
    setSearchQuery,
    selectedUnit,
    setSelectedUnit,
    selectedBed,
    setSelectedBed,
    showOnlyAlerts,
    setShowOnlyAlerts,
  } = usePatientFilter();

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedUnit("all");
    setSelectedBed("all");
    setShowOnlyAlerts(false);
  }, [setSearchQuery, setSelectedUnit, setSelectedBed, setShowOnlyAlerts]);

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
    // Single item - fully rounded
    if (length === 1) {
      return "rounded-md";
    }
    // First item
    if (index === 0) {
      return "rounded-t-md rounded-b-none";
    }
    // Last item
    if (index === length - 1) {
      return "rounded-t-none rounded-b-md";
    }
    // Middle items
    return "rounded-none";
  };

  return (
    <>
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
            variant={isSelectionMode ? "secondary" : "outline"}
            onClick={toggleSelectionMode}
            className="gap-2"
            size="sm"
          >
            {isSelectionMode ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                Select
              </>
            )}
          </Button>
        </div>

        <CreatePatientDialog
          onCreatePatient={handleCreatePatient}
          existingPatients={patients}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
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

      {/* Results Count - only show when there are patients */}
      {!loading && !error && patients.length > 0 && (
        <div className="mb-2 text-sm text-muted-foreground">
          {filteredPatients.length}{" "}
          {filteredPatients.length === 1 ? "patient" : "patients"} found
        </div>
      )}

      {/* Patients List */}
      {!loading && !error && (
        <div className="space-y-2">
          {patients.length === 0 ? (
            // No patients at all - first time user
            <NoPatientsEmptyState
              onCreatePatient={() => setCreateDialogOpen(true)}
            />
          ) : filteredPatients.length === 0 ? (
            // Has patients but none match filters
            <NoSearchResultsEmptyState
              onClearFilters={clearFilters}
              searchQuery={searchQuery}
            />
          ) : (
            filteredPatients.map((patient, index) => {
              const isSelected = selectedPatients.some((p) => p.id === patient.id);
              const card = (
                <PatientResumeCard
                  patient={patient}
                  className={getRoundedClass(filteredPatients.length, index)}
                  handleEditPatient={handleEditPatient}
                  isSelectionMode={isSelectionMode}
                  isSelected={isSelected}
                  onSelect={handlePatientSelect}
                />
              );

              // In selection mode, clicking the card toggles selection
              // Otherwise, clicking navigates to patient detail
              if (isSelectionMode) {
                return (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="cursor-pointer"
                  >
                    {card}
                  </div>
                );
              }

              return (
                <Link key={patient.id} to={`/patients/${patient.rut}`}>
                  {card}
                </Link>
              );
            })
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

      {/* Keyboard shortcuts help overlay - triggered by pressing "?" */}
      <KeyboardShortcutsHelp shortcuts={keyboardShortcuts} />

      {/* Pull-to-refresh indicator (mobile) */}
      <PullToRefreshIndicator
        isRefreshing={isRefreshing}
        progress={progress}
        pullDistance={pullDistance}
      />

      {/* Floating Action Button (mobile) */}
      <button
        onClick={() => setCreateDialogOpen(true)}
        className="fab touch-feedback-primary"
        aria-label="Add new patient"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Mobile Filter Button */}
      <button
        onClick={() => setMobileFilterOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center hover:bg-secondary/90 active:scale-95 transition-all duration-150 md:hidden"
        aria-label="Open filters"
      >
        <Filter className="h-5 w-5" />
      </button>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter Patients"
      >
        <div className="space-y-4">
          <PatientsFilter />
        </div>
      </MobileFilterDrawer>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedPatients={selectedPatients}
        onClearSelection={handleClearSelection}
        onStatusChange={handleBulkStatusChange}
      />
    </>
  );
}

export function PatientsPage() {
  return (
    <PatientFilterProvider>
      <PatientsPageContent />
    </PatientFilterProvider>
  );
}
