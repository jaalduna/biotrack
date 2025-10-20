"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Pause,
  CheckCircle,
  Clock,
  Bed,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

interface TreatmentRecord {
  id: string;
  antibioticName: string;
  antibioticType: "antibiotic" | "corticoide";
  startDate: string;
  daysApplied: number;
  programmedDays: number;
  status: "active" | "suspended" | "extended" | "finished";
  startCount: 0 | 1;
}

interface BedHistoryEntry {
  id: string;
  bedNumber: number;
  unit: "UCI" | "UTI";
  startDate: string;
  endDate?: string;
}

interface Patient {
  rut: string;
  name: string;
  status: "waiting" | "active" | "archived";
}

// Mock data
const mockPatient: Patient = {
  rut: "12.345.678-9",
  name: "María González Pérez",
  status: "active",
};

const mockTreatmentRecords: TreatmentRecord[] = [
  {
    id: "1",
    antibioticName: "Amoxicillin",
    antibioticType: "antibiotic",
    startDate: "2025-01-10",
    daysApplied: 9,
    programmedDays: 10,
    status: "active",
    startCount: 1,
  },
  {
    id: "2",
    antibioticName: "Azithromycin",
    antibioticType: "antibiotic",
    startDate: "2025-01-10",
    daysApplied: 9,
    programmedDays: 14,
    status: "active",
    startCount: 1,
  },
  {
    id: "3",
    antibioticName: "Ciprofloxacin",
    antibioticType: "antibiotic",
    startDate: "2024-12-20",
    daysApplied: 14,
    programmedDays: 14,
    status: "finished",
    startCount: 0,
  },
  {
    id: "4",
    antibioticName: "Dexamethasone",
    antibioticType: "corticoide",
    startDate: "2025-01-05",
    daysApplied: 14,
    programmedDays: 21,
    status: "active",
    startCount: 0,
  },
];

const mockBedHistory: BedHistoryEntry[] = [
  { id: "1", bedNumber: 5, unit: "UCI", startDate: "2025-01-10" },
  {
    id: "2",
    bedNumber: 3,
    unit: "UCI",
    startDate: "2025-01-05",
    endDate: "2025-01-09",
  },
  {
    id: "3",
    bedNumber: 12,
    unit: "UCI",
    startDate: "2024-12-28",
    endDate: "2025-01-04",
  },
];

const availableAntibiotics = [
  {
    name: "Amoxicillin",
    type: "antibiotic" as const,
    defaultStartCount: 1 as 0 | 1,
  },
  {
    name: "Azithromycin",
    type: "antibiotic" as const,
    defaultStartCount: 1 as 0 | 1,
  },
  {
    name: "Ciprofloxacin",
    type: "antibiotic" as const,
    defaultStartCount: 0 as 0 | 1,
  },
  {
    name: "Doxycycline",
    type: "antibiotic" as const,
    defaultStartCount: 1 as 0 | 1,
  },
  {
    name: "Metronidazole",
    type: "antibiotic" as const,
    defaultStartCount: 0 as 0 | 1,
  },
  {
    name: "Penicillin",
    type: "antibiotic" as const,
    defaultStartCount: 1 as 0 | 1,
  },
  {
    name: "Dexamethasone",
    type: "corticoide" as const,
    defaultStartCount: 0 as 0 | 1,
  },
  {
    name: "Prednisone",
    type: "corticoide" as const,
    defaultStartCount: 0 as 0 | 1,
  },
  {
    name: "Hydrocortisone",
    type: "corticoide" as const,
    defaultStartCount: 0 as 0 | 1,
  },
];

export function PatientDetailPage() {
  const [patient] = useState<Patient>(mockPatient);
  const [treatmentRecords, setTreatmentRecords] =
    useState<TreatmentRecord[]>(mockTreatmentRecords);
  const [bedHistory] = useState<BedHistoryEntry[]>(mockBedHistory);
  const [isNewProgramOpen, setIsNewProgramOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [extendingRecordId, setExtendingRecordId] = useState<string | null>(
    null,
  );

  const [antibioticSearchQuery, setAntibioticSearchQuery] = useState("");
  const [antibioticTypeFilter, setAntibioticTypeFilter] = useState<
    "all" | "antibiotic" | "corticoide"
  >("all");
  const [selectedAntibiotics, setSelectedAntibiotics] = useState<string[]>([]);
  const [antibioticAmounts, setAntibioticAmounts] = useState<
    Record<string, string>
  >({});
  const [antibioticStartCounts, setAntibioticStartCounts] = useState<
    Record<string, 0 | 1>
  >({});
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [days, setDays] = useState("");
  const [extendDays, setExtendDays] = useState("");

  const calculateTotalResume = () => {
    const antibioticTotals: Record<string, number> = {};
    let maxDays = 0;

    treatmentRecords.forEach((record) => {
      if (!antibioticTotals[record.antibioticName]) {
        antibioticTotals[record.antibioticName] = 0;
      }
      antibioticTotals[record.antibioticName] += record.daysApplied;
      maxDays = Math.max(maxDays, antibioticTotals[record.antibioticName]);
    });

    return { antibioticTotals, maxDays };
  };

  const { antibioticTotals, maxDays } = calculateTotalResume();

  const filteredAntibiotics = availableAntibiotics.filter((antibiotic) => {
    const matchesSearch = antibiotic.name
      .toLowerCase()
      .includes(antibioticSearchQuery.toLowerCase());
    const matchesType =
      antibioticTypeFilter === "all" ||
      antibiotic.type === antibioticTypeFilter;
    return matchesSearch && matchesType;
  });

  const toggleAntibiotic = (antibioticName: string) => {
    setSelectedAntibiotics((prev) => {
      if (prev.includes(antibioticName)) {
        return prev.filter((a) => a !== antibioticName);
      } else {
        const antibiotic = availableAntibiotics.find(
          (a) => a.name === antibioticName,
        );
        if (antibiotic) {
          setAntibioticStartCounts((prevCounts) => ({
            ...prevCounts,
            [antibioticName]: antibiotic.defaultStartCount,
          }));
        }
        return [...prev, antibioticName];
      }
    });
  };

  const handleStartProgram = () => {
    console.log("[v0] Starting new program:", {
      antibiotics: selectedAntibiotics,
      amounts: antibioticAmounts,
      startCounts: antibioticStartCounts,
      startDate,
      days,
    });
    setIsNewProgramOpen(false);
    // Reset form
    setSelectedAntibiotics([]);
    setAntibioticAmounts({});
    setAntibioticStartCounts({});
    setAntibioticSearchQuery("");
    setAntibioticTypeFilter("all");
    setStartDate(new Date().toISOString().split("T")[0]);
    setDays("");
  };

  const handleSuspendRecord = (recordId: string) => {
    console.log("[v0] Suspending record:", recordId);
    setTreatmentRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? { ...record, status: "suspended" as const }
          : record,
      ),
    );
  };

  const handleFinalizeRecord = (recordId: string) => {
    console.log("[v0] Finalizing record:", recordId);
    setTreatmentRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? { ...record, status: "finished" as const }
          : record,
      ),
    );
  };

  const handleExtendRecord = () => {
    if (!extendingRecordId) return;
    console.log(
      "[v0] Extending record:",
      extendingRecordId,
      "by",
      extendDays,
      "days",
    );
    setTreatmentRecords((prev) =>
      prev.map((record) =>
        record.id === extendingRecordId
          ? {
              ...record,
              programmedDays:
                record.programmedDays + Number.parseInt(extendDays),
              status: "extended" as const,
            }
          : record,
      ),
    );
    setIsExtendOpen(false);
    setExtendDays("");
    setExtendingRecordId(null);
  };

  const openExtendDialog = (recordId: string) => {
    setExtendingRecordId(recordId);
    setIsExtendOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link to="/patients">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Patients
            </Button>
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {patient.name}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                RUT: {patient.rut}
              </p>
            </div>
            <Badge
              variant={patient.status === "active" ? "default" : "secondary"}
              className="w-fit"
            >
              {patient.status === "active"
                ? "Active"
                : patient.status === "waiting"
                  ? "Waiting for Treatment"
                  : "Archived"}
            </Badge>
          </div>
        </div>

        {/* Resume Cards */}
        {/* <div className="mb-8 grid gap-4 sm:grid-cols-2"> */}
        {/*   <Card className="p-6"> */}
        {/*     <div className="flex items-center gap-3"> */}
        {/*       <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"> */}
        {/*         <Calendar className="h-6 w-6 text-primary" /> */}
        {/*       </div> */}
        {/*       <div> */}
        {/*         <p className="text-sm font-medium text-muted-foreground"> */}
        {/*           Active Programs */}
        {/*         </p> */}
        {/*         <p className="text-3xl font-bold text-foreground"> */}
        {/*           {treatmentRecords.filter((r) => r.status === "active").length} */}
        {/*         </p> */}
        {/*       </div> */}
        {/*     </div> */}
        {/*   </Card> */}
        {/**/}
        {/*   <Card className="p-6"> */}
        {/*     <div className="flex items-center gap-3"> */}
        {/*       <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10"> */}
        {/*         <Clock className="h-6 w-6 text-accent" /> */}
        {/*       </div> */}
        {/*       <div> */}
        {/*         <p className="text-sm font-medium text-muted-foreground"> */}
        {/*           Total Treatments */}
        {/*         </p> */}
        {/*         <p className="text-3xl font-bold text-foreground"> */}
        {/*           {treatmentRecords.length} */}
        {/*         </p> */}
        {/*       </div> */}
        {/*     </div> */}
        {/*   </Card> */}
        {/* </div> */}

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Treatment Records
            </h2>
            <Dialog open={isNewProgramOpen} onOpenChange={setIsNewProgramOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Program
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Start New Antibiotic Program</DialogTitle>
                  <DialogDescription>
                    Configure the antibiotic treatment for this patient. Select
                    one or more antibiotics.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search antibiotics..."
                          value={antibioticSearchQuery}
                          onChange={(e) =>
                            setAntibioticSearchQuery(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      {antibioticSearchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAntibioticSearchQuery("")}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Type:
                      </span>
                      <Badge
                        variant={
                          antibioticTypeFilter === "all" ? "default" : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => setAntibioticTypeFilter("all")}
                      >
                        All
                      </Badge>
                      <Badge
                        variant={
                          antibioticTypeFilter === "antibiotic"
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => setAntibioticTypeFilter("antibiotic")}
                      >
                        Antibiotics
                      </Badge>
                      <Badge
                        variant={
                          antibioticTypeFilter === "corticoide"
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => setAntibioticTypeFilter("corticoide")}
                      >
                        Corticoides
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Select Antibiotics/Corticoides</Label>
                    <div className="max-h-[300px] space-y-3 overflow-y-auto rounded-md border p-4">
                      {filteredAntibiotics.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                          No antibiotics found
                        </p>
                      ) : (
                        filteredAntibiotics.map((antibiotic) => (
                          <div key={antibiotic.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={antibiotic.name}
                                  checked={selectedAntibiotics.includes(
                                    antibiotic.name,
                                  )}
                                  onCheckedChange={() =>
                                    toggleAntibiotic(antibiotic.name)
                                  }
                                />
                                <label
                                  htmlFor={antibiotic.name}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {antibiotic.name}
                                </label>
                                <Badge variant="secondary" className="text-xs">
                                  {antibiotic.type}
                                </Badge>
                              </div>
                            </div>
                            {selectedAntibiotics.includes(antibiotic.name) && (
                              <div className="ml-6 space-y-2">
                                <Input
                                  placeholder="Dosage (optional, e.g., 500mg)"
                                  value={
                                    antibioticAmounts[antibiotic.name] || ""
                                  }
                                  onChange={(e) =>
                                    setAntibioticAmounts((prev) => ({
                                      ...prev,
                                      [antibiotic.name]: e.target.value,
                                    }))
                                  }
                                />
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">
                                    Start count:
                                  </Label>
                                  <Select
                                    value={
                                      antibioticStartCounts[
                                        antibiotic.name
                                      ]?.toString() || "0"
                                    }
                                    onValueChange={(value) =>
                                      setAntibioticStartCounts((prev) => ({
                                        ...prev,
                                        [antibiotic.name]: Number.parseInt(
                                          value,
                                        ) as 0 | 1,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-[100px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">0</SelectItem>
                                      <SelectItem value="1">1</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="days">Number of Days</Label>
                    <Input
                      id="days"
                      type="number"
                      placeholder="e.g., 14"
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsNewProgramOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartProgram}
                    disabled={selectedAntibiotics.length === 0}
                  >
                    Start Program
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="overflow-hidden">
            {treatmentRecords.length === 0 ? (
              <div className="p-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  No treatment records yet
                </p>
                <Button
                  onClick={() => setIsNewProgramOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Start New Program
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {treatmentRecords.map((record) => {
                  const daysRemaining =
                    record.programmedDays - record.daysApplied;
                  const isEndingSoon =
                    daysRemaining === 1 && record.status === "active";
                  return (
                    <div
                      key={record.id}
                      className={`p-4 ${isEndingSoon ? "bg-orange-500/10" : ""}`}
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">
                              {record.antibioticName}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {record.antibioticType}
                            </Badge>
                            <Badge
                              variant={
                                record.status === "active"
                                  ? "default"
                                  : record.status === "finished"
                                    ? "outline"
                                    : "secondary"
                              }
                            >
                              {record.status}
                            </Badge>
                            {isEndingSoon && (
                              <Badge
                                variant="destructive"
                                className="bg-orange-500"
                              >
                                1 Day Left
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-6">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Start Date
                              </p>
                              <p className="font-semibold text-foreground">
                                {new Date(
                                  record.startDate,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Days Applied / Programmed
                              </p>
                              <p className="font-semibold text-foreground">
                                {record.daysApplied} / {record.programmedDays}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Day left
                              </p>
                              <p className="font-semibold text-foreground">
                                {record.programmedDays - record.daysApplied}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {record.status === "active" && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspendRecord(record.id)}
                            className="gap-2 bg-transparent"
                          >
                            <Pause className="h-4 w-4" />
                            Suspend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openExtendDialog(record.id)}
                            className="gap-2 bg-transparent"
                          >
                            <Clock className="h-4 w-4" />
                            Extend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFinalizeRecord(record.id)}
                            className="gap-2 bg-transparent"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Finalize
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Extend Dialog */}
        <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Treatment Duration</DialogTitle>
              <DialogDescription>
                Add additional days to this treatment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="extendDays">Additional Days</Label>
                <Input
                  id="extendDays"
                  type="number"
                  placeholder="e.g., 7"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExtendOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExtendRecord}>Extend</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bed History */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Bed History
          </h2>
          <Card className="overflow-hidden">
            {bedHistory.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No bed history records</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {bedHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex flex-1 items-center gap-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Bed className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Bed & Unit
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            Bed {entry.bedNumber}
                          </p>
                          <Badge variant="secondary">{entry.unit}</Badge>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Start Date
                        </p>
                        <p className="font-semibold text-foreground">
                          {new Date(entry.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          End Date
                        </p>
                        <p className="font-semibold text-foreground">
                          {entry.endDate
                            ? new Date(entry.endDate).toLocaleDateString()
                            : "Current"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Total Resume
          </h2>
          <Card className="p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground">
                Total de días con antibioticos aplicados
              </p>
              <p className="text-4xl font-bold text-foreground">
                {maxDays} días
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Days Applied by Antibiotic
              </h3>
              <div className="space-y-3">
                {Object.entries(antibioticTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, days]) => (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {name}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {days} days
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${maxDays > 0 ? (days / maxDays) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
