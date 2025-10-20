import { useState } from "react";
import { Search, Plus, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "react-router";

type PatientStatus = "waiting" | "active" | "archived";
type Unit = "UCI" | "UTI";

interface Patient {
  id: string;
  rut: string;
  name: string;
  status: PatientStatus;
  unit: Unit;
  bedNumber: number;
  hasEndingSoonProgram?: boolean;
}

const mockPatients: Patient[] = [
  {
    id: "1",
    rut: "12.345.678-9",
    name: "María González Pérez",
    status: "active",
    unit: "UCI",
    bedNumber: 5,
    hasEndingSoonProgram: true,
  },
  {
    id: "2",
    rut: "23.456.789-0",
    name: "Juan Carlos Rodríguez",
    status: "waiting",
    unit: "UTI",
    bedNumber: 22,
  },
  {
    id: "3",
    rut: "34.567.890-1",
    name: "Ana Patricia Silva",
    status: "active",
    unit: "UCI",
    bedNumber: 12,
  },
  {
    id: "4",
    rut: "45.678.901-2",
    name: "Pedro Martínez López",
    status: "archived",
    unit: "UTI",
    bedNumber: 28,
  },
  {
    id: "5",
    rut: "56.789.012-3",
    name: "Carmen Fernández Torres",
    status: "active",
    unit: "UCI",
    bedNumber: 3,
  },
  {
    id: "6",
    rut: "67.890.123-4",
    name: "Roberto Sánchez Muñoz",
    status: "waiting",
    unit: "UTI",
    bedNumber: 19,
  },
  {
    id: "7",
    rut: "78.901.234-5",
    name: "Isabel Ramírez Castro",
    status: "active",
    unit: "UCI",
    bedNumber: 8,
    hasEndingSoonProgram: true,
  },
  {
    id: "8",
    rut: "89.012.345-6",
    name: "Diego Vargas Morales",
    status: "archived",
    unit: "UTI",
    bedNumber: 34,
  },
];

const statusConfig: Record<
  PatientStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  waiting: { label: "Waiting for Treatment", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  archived: { label: "Archived", variant: "outline" },
};

const uciBeds = Array.from({ length: 17 }, (_, i) => i + 1);
const utiBeds = Array.from({ length: 17 }, (_, i) => i + 18);
const allBeds = [...uciBeds, ...utiBeds];

export function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients] = useState<Patient[]>(mockPatients);
  const [selectedUnit, setSelectedUnit] = useState<Unit | "all">("all");
  const [selectedBed, setSelectedBed] = useState<string>("all");
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatientRut, setNewPatientRut] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientUnit, setNewPatientUnit] = useState<Unit>("UCI");
  const [newPatientBed, setNewPatientBed] = useState("");

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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedUnit("all");
    setSelectedBed("all");
    setShowOnlyAlerts(false);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedUnit !== "all" ||
    selectedBed !== "all" ||
    showOnlyAlerts;

  const handleAddPatient = () => {
    console.log("[v0] Add patient:", {
      rut: newPatientRut,
      name: newPatientName,
      unit: newPatientUnit,
      bed: newPatientBed,
    });
    setIsAddPatientOpen(false);
    setNewPatientRut("");
    setNewPatientName("");
    setNewPatientUnit("UCI");
    setNewPatientBed("");
  };

  const handleEditPatient = (patientId: string) => {
    console.log("[v0] Edit patient clicked:", patientId);
  };

  const getAvailableBeds = () => {
    if (newPatientUnit === "UCI") return uciBeds;
    return utiBeds;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Biotrack Patients
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage and track bioantibiotics program patients
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or RUT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Patient</DialogTitle>
                  <DialogDescription>
                    Enter the patient information to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      placeholder="e.g., 12.345.678-9"
                      value={newPatientRut}
                      onChange={(e) => setNewPatientRut(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Complete Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., María González Pérez"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={newPatientUnit}
                      onValueChange={(value) =>
                        setNewPatientUnit(value as Unit)
                      }
                    >
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UCI">UCI (Beds 1-17)</SelectItem>
                        <SelectItem value="UTI">UTI (Beds 18-34)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bed">Bed Number</Label>
                    <Select
                      value={newPatientBed}
                      onValueChange={setNewPatientBed}
                    >
                      <SelectTrigger id="bed">
                        <SelectValue placeholder="Select bed" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableBeds().map((bed) => (
                          <SelectItem key={bed} value={bed.toString()}>
                            Bed {bed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddPatientOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddPatient}>Add Patient</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Unit:
              </span>
              <Badge
                variant={selectedUnit === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedUnit("all")}
              >
                All
              </Badge>
              <Badge
                variant={selectedUnit === "UCI" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedUnit("UCI")}
              >
                UCI
              </Badge>
              <Badge
                variant={selectedUnit === "UTI" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedUnit("UTI")}
              >
                UTI
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Bed:
              </span>
              <Select value={selectedBed} onValueChange={setSelectedBed}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All beds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All beds</SelectItem>
                  {allBeds.map((bed) => (
                    <SelectItem key={bed} value={bed.toString()}>
                      Bed {bed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Alerts:
              </span>
              <Badge
                variant={showOnlyAlerts ? "destructive" : "outline"}
                className="cursor-pointer bg-orange-500"
                onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
              >
                1 Day Left
              </Badge>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

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
