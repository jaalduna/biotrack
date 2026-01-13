"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  ArrowLeft,
  Plus,
  Pause,
  CheckCircle,
  Clock,
  Bed,
  Search,
  X,
  AlertCircle,
  Trash2,
  Edit,
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
import { Textarea } from "@/components/ui/textarea";
import { AntibioticTimeline } from "@/components/patients/AntibioticTimeline";
import { NoTreatmentsEmptyState, NoDiagnosticsEmptyState } from "@/components/EmptyState";
import { patientsApi, treatmentsApi, diagnosticsApi, diagnosticCategoriesApi, antibioticsApi } from "@/services/Api";
import type { Patient as PatientType } from "@/models/Patients";
import type { DiagnosticCategory, DiagnosticSubcategory, Antibiotic } from "@/services/Api";

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

interface DiagnosticRecord {
   id: string;
   diagnosisName: string;
   diagnosisCode?: string;
   categoryId?: string;
   subcategoryId?: string;
   categoryName?: string;
   dateDiagnosed: string;
   severity: "mild" | "moderate" | "severe" | "critical";
   notes?: string;
   createdBy?: string;
 }

const getSeverityBadgeColor = (severity: string) => {
  switch (severity) {
    case "mild":
      return "bg-green-500/10 text-green-700 hover:bg-green-500/20";
    case "moderate":
      return "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20";
    case "severe":
      return "bg-orange-500/10 text-orange-700 hover:bg-orange-500/20";
    case "critical":
      return "bg-red-500/10 text-red-700 hover:bg-red-500/20";
    default:
      return "";
  }
};

export function PatientDetailPage() {
  const { id: rutParam } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treatmentRecords, setTreatmentRecords] =
    useState<TreatmentRecord[]>([]);  // Start empty, not with mock data
  const [bedHistory] = useState<BedHistoryEntry[]>([]);  // Start empty, not with mock data
  const [diagnostics, setDiagnostics] = useState<DiagnosticRecord[]>([]);  // Start empty, not with mock data
  const [isNewProgramOpen, setIsNewProgramOpen] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [extendingRecordId, setExtendingRecordId] = useState<string | null>(
    null,
  );
  const [isAddDiagnosisOpen, setIsAddDiagnosisOpen] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<DiagnosticRecord | null>(null);
  const [categories, setCategories] = useState<DiagnosticCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subcategories, setSubcategories] = useState<DiagnosticSubcategory[]>([]);
  const [availableAntibiotics, setAvailableAntibiotics] = useState<Antibiotic[]>([]);

  // Fetch patient by RUT from URL
  useEffect(() => {
    async function loadPatient() {
      if (!rutParam) {
        setError("No patient RUT provided");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const fetchedPatient = await patientsApi.getByRut(rutParam);
        if (!fetchedPatient) {
          setError(`Patient with RUT ${rutParam} not found`);
        } else {
          setPatient(fetchedPatient);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load patient");
        console.error("Error loading patient:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPatient();
  }, [rutParam]);

  // Load treatments and diagnostics for patient
  useEffect(() => {
    async function loadPatientData() {
      if (!patient || !patient.id) return;

      try {
        // Load treatments
        const treatments = await treatmentsApi.getByPatientId(patient.id);
        const formattedTreatments: TreatmentRecord[] = treatments.map(t => ({
          id: t.id,
          antibioticName: t.antibioticName,
          antibioticType: t.antibioticType,
          startDate: t.startDate,
          daysApplied: t.daysApplied,
          programmedDays: t.programmedDays,
          status: t.status,
          startCount: t.startCount,
        }));
        setTreatmentRecords(formattedTreatments);

        // Load diagnostics
        const diagnostics = await diagnosticsApi.getByPatientId(patient.id);
        const formattedDiagnostics: DiagnosticRecord[] = diagnostics.map(d => {
          const category = categories.find(cat => cat.id === d.categoryId);
          return {
            id: d.id,
            diagnosisName: d.diagnosisName,
            diagnosisCode: d.diagnosisCode,
            categoryId: d.categoryId,
            subcategoryId: d.subcategoryId,
            categoryName: category?.name,
            dateDiagnosed: d.dateDiagnosed,
            severity: d.severity,
            notes: d.notes,
            createdBy: d.createdBy,
          };
        });
        setDiagnostics(formattedDiagnostics);
      } catch (err) {
        console.error("Error loading patient data:", err);
        // Don't show error, just continue with empty data
      }
    }

    loadPatientData();
  }, [patient?.id]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await diagnosticCategoriesApi.getAll();
        setCategories(cats);
      } catch (err) {
        console.error("Error loading diagnostic categories:", err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadAntibiotics() {
      try {
        const antibiotics = await antibioticsApi.getAll();
        setAvailableAntibiotics(antibiotics);
      } catch (err) {
        console.error("Error loading antibiotics:", err);
      }
    }
    loadAntibiotics();
  }, []);

  useEffect(() => {
    async function loadSubcategories() {
      if (!selectedCategoryId) {
        setSubcategories([]);
        return;
      }
      try {
        const subs = await diagnosticCategoriesApi.getSubcategoriesByCategory(selectedCategoryId);
        setSubcategories(subs);
      } catch (err) {
        console.error("Error loading subcategories:", err);
      }
    }
    loadSubcategories();
  }, [selectedCategoryId]);

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
  
  // Diagnosis Form State
  const [diagnosisForm, setDiagnosisForm] = useState({
    diagnosisName: "",
    diagnosisCode: "",
    categoryId: "",
    subcategoryId: "",
    dateDiagnosed: new Date().toISOString().split("T")[0],
    severity: "moderate" as "mild" | "moderate" | "severe" | "critical",
    notes: "",
    createdBy: "",
  });

  // Treatment Records Filters
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState<
    "all" | "active" | "finished" | "suspended" | "extended"
  >("all");
  const [treatmentTypeFilter, setTreatmentTypeFilter] = useState<
    "all" | "antibiotic" | "corticoide"
  >("all");

  // Transform treatment records to timeline format
  const timelineTreatments = treatmentRecords.map((record) => {
    // Handle null/undefined dates
    if (!record.startDate) {
      console.warn("Treatment has no start date:", record);
      return null;
    }

    const startDate = new Date(record.startDate);
    
    // Verify date is valid
    if (isNaN(startDate.getTime())) {
      console.error("Invalid start date:", record.startDate, "for treatment:", record.id);
      return null;
    }

    // Calculate endDate based on programmedDays (total planned duration)
    // NOT daysApplied (which is the current progress)
    const endDate = new Date(startDate);
    const daysToAdd = record.programmedDays > 0 ? record.programmedDays - 1 : 0;
    endDate.setDate(endDate.getDate() + daysToAdd);
    
    console.log(`Treatment ${record.antibioticName}:`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      daysApplied: record.daysApplied,
      programmedDays: record.programmedDays,
      calculatedDuration: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    });
    
    return {
      id: record.id,
      antibioticName: record.antibioticName,
      antibioticType: record.antibioticType,
      startDate,
      endDate,
      daysApplied: record.daysApplied,
      programmedDays: record.programmedDays,
      status: record.status,
    };
  }).filter((t): t is NonNullable<typeof t> => t !== null);

  const filteredAntibiotics = availableAntibiotics.filter((antibiotic) => {
    const matchesSearch = antibiotic.name
      .toLowerCase()
      .includes(antibioticSearchQuery.toLowerCase());
    const matchesType =
      antibioticTypeFilter === "all" ||
      antibiotic.type === antibioticTypeFilter;
    return matchesSearch && matchesType;
  });

  // Filter treatment records
  const filteredTreatmentRecords = treatmentRecords.filter((record) => {
    const matchesStatus =
      treatmentStatusFilter === "all" || record.status === treatmentStatusFilter;
    const matchesType =
      treatmentTypeFilter === "all" ||
      record.antibioticType === treatmentTypeFilter;
    return matchesStatus && matchesType;
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
            [antibioticName]: antibiotic.default_start_count,
          }));
        }
        return [...prev, antibioticName];
      }
    });
  };

   const handleStartProgram = async () => {
    if (!patient || selectedAntibiotics.length === 0) {
      alert("Please select at least one antibiotic");
      return;
    }

    if (!days) {
      alert("Please enter the number of days");
      return;
    }

    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      alert("Days must be between 1 and 365");
      return;
    }

    try {
      // Create a treatment record for each selected antibiotic
      const newTreatments: TreatmentRecord[] = [];
      
      for (const antibioticName of selectedAntibiotics) {
        const antibiotic = availableAntibiotics.find(a => a.name === antibioticName);
        if (!antibiotic) continue;

        const newTreatment = await treatmentsApi.create({
          patientId: patient.id,
          antibioticName,
          antibioticType: antibiotic.type,
          startDate,
          daysApplied: 0,
          programmedDays: daysNum,
          status: "active",
          startCount: antibioticStartCounts[antibioticName] || antibiotic.default_start_count,
          dosage: antibioticAmounts[antibioticName] || undefined,
        });

        // Convert from API response format to local TreatmentRecord format
        newTreatments.push({
          id: newTreatment.id,
          antibioticName: newTreatment.antibioticName,
          antibioticType: newTreatment.antibioticType,
          startDate: newTreatment.startDate,
          daysApplied: newTreatment.daysApplied,
          programmedDays: newTreatment.programmedDays,
          status: newTreatment.status as "active" | "suspended" | "extended" | "finished",
          startCount: newTreatment.startCount,
        });
      }

      // Add all new treatments to state
      setTreatmentRecords((prev) => [...prev, ...newTreatments]);

      // Close dialog and reset form
      setIsNewProgramOpen(false);
      setSelectedAntibiotics([]);
      setAntibioticAmounts({});
      setAntibioticStartCounts({});
      setAntibioticSearchQuery("");
      setAntibioticTypeFilter("all");
      setStartDate(new Date().toISOString().split("T")[0]);
      setDays("");

      alert("Treatment program(s) created successfully!");
    } catch (error) {
      console.error("Error creating treatment program:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create treatment program"
      );
    }
  };

   const handleSuspendRecord = async (recordId: string) => {
     try {
       const record = treatmentRecords.find(r => r.id === recordId);
       if (!record) return;

       const startDate = new Date(record.startDate);
       const today = new Date();
       const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
       
       await treatmentsApi.update(recordId, {
         id: record.id,
         patientId: record.id,
         antibioticName: record.antibioticName,
         antibioticType: record.antibioticType,
         startDate: record.startDate,
         daysApplied: elapsedDays,
         programmedDays: elapsedDays,
         status: "suspended",
         startCount: record.startCount,
       });

       setTreatmentRecords((prev) =>
         prev.map((r) =>
           r.id === recordId ? { 
             ...r, 
             status: "suspended" as const,
             daysApplied: elapsedDays,
             programmedDays: elapsedDays
           } : r,
         ),
       );
     } catch (error) {
       console.error("Error suspending treatment:", error);
       alert("Failed to suspend treatment");
     }
   };

  const handleFinalizeRecord = async (recordId: string) => {
    try {
      const record = treatmentRecords.find(r => r.id === recordId);
      if (!record) return;

      await treatmentsApi.update(recordId, {
        id: record.id,
        patientId: record.id,
        antibioticName: record.antibioticName,
        antibioticType: record.antibioticType,
        startDate: record.startDate,
        daysApplied: record.daysApplied,
        programmedDays: record.programmedDays,
        status: "finished",
        startCount: record.startCount,
      });

      setTreatmentRecords((prev) =>
        prev.map((r) =>
          r.id === recordId ? { ...r, status: "finished" as const } : r,
        ),
      );
    } catch (error) {
      console.error("Error finalizing treatment:", error);
      alert("Failed to finalize treatment");
    }
  };

   const handleExtendRecord = async () => {
    if (!extendingRecordId || !extendDays) {
      alert("Please enter the number of days to extend");
      return;
    }

    const extendDaysNum = parseInt(extendDays);
    if (isNaN(extendDaysNum) || extendDaysNum < 1) {
      alert("Days must be a positive number");
      return;
    }

    try {
      // Find the treatment being extended
      const treatmentToExtend = treatmentRecords.find(r => r.id === extendingRecordId);
      if (!treatmentToExtend) {
        alert("Treatment not found");
        return;
      }

      // Update the treatment with new programmed days and extended status
      const updatedTreatment = await treatmentsApi.update(extendingRecordId, {
        id: treatmentToExtend.id,
        patientId: treatmentToExtend.id,
        antibioticName: treatmentToExtend.antibioticName,
        antibioticType: treatmentToExtend.antibioticType,
        startDate: treatmentToExtend.startDate,
        daysApplied: treatmentToExtend.daysApplied,
        programmedDays: treatmentToExtend.programmedDays + extendDaysNum,
        status: "extended",
        startCount: treatmentToExtend.startCount,
      });

      setTreatmentRecords((prev) =>
        prev.map((record) =>
          record.id === extendingRecordId
            ? {
                ...record,
                programmedDays: updatedTreatment.programmedDays,
                status: "extended" as const,
              }
            : record,
        ),
      );

      setIsExtendOpen(false);
      setExtendDays("");
      setExtendingRecordId(null);
      alert("Treatment extended successfully!");
    } catch (error) {
      console.error("Error extending treatment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to extend treatment"
      );
    }
  };

  const openExtendDialog = (recordId: string) => {
    setExtendingRecordId(recordId);
    setIsExtendOpen(true);
  };

  const handleOpenDiagnosisDialog = (diagnosis: DiagnosticRecord | null) => {
    if (diagnosis) {
      setEditingDiagnosis(diagnosis);
      setDiagnosisForm({
        diagnosisName: diagnosis.diagnosisName,
        diagnosisCode: diagnosis.diagnosisCode || "",
        categoryId: diagnosis.categoryId || "",
        subcategoryId: diagnosis.subcategoryId || "",
        dateDiagnosed: diagnosis.dateDiagnosed,
        severity: diagnosis.severity,
        notes: diagnosis.notes || "",
        createdBy: diagnosis.createdBy || "",
      });
      if (diagnosis.categoryId) {
        setSelectedCategoryId(diagnosis.categoryId);
      }
    } else {
      setEditingDiagnosis(null);
      setDiagnosisForm({
        diagnosisName: "",
        diagnosisCode: "",
        categoryId: "",
        subcategoryId: "",
        dateDiagnosed: new Date().toISOString().split("T")[0],
        severity: "moderate",
        notes: "",
        createdBy: "",
      });
      setSelectedCategoryId("");
    }
    setIsAddDiagnosisOpen(true);
  };

   const handleSaveDiagnosis = async () => {
    if (!patient || !diagnosisForm.diagnosisName) {
      alert("Please enter a diagnosis name");
      return;
    }

    try {
      let newDiagnosis: DiagnosticRecord;

      if (editingDiagnosis) {
        const updatedDiag = await diagnosticsApi.update(editingDiagnosis.id, {
          id: editingDiagnosis.id,
          patientId: patient.id,
          diagnosisName: diagnosisForm.diagnosisName,
          diagnosisCode: diagnosisForm.diagnosisCode || undefined,
          categoryId: diagnosisForm.categoryId || undefined,
          subcategoryId: diagnosisForm.subcategoryId || undefined,
          dateDiagnosed: diagnosisForm.dateDiagnosed,
          severity: diagnosisForm.severity as "mild" | "moderate" | "severe" | "critical",
          notes: diagnosisForm.notes || undefined,
          createdBy: diagnosisForm.createdBy || undefined,
        });

        newDiagnosis = {
          id: updatedDiag.id,
          diagnosisName: updatedDiag.diagnosisName,
          diagnosisCode: updatedDiag.diagnosisCode,
          categoryId: updatedDiag.categoryId,
          subcategoryId: updatedDiag.subcategoryId,
          dateDiagnosed: updatedDiag.dateDiagnosed,
          severity: updatedDiag.severity,
          notes: updatedDiag.notes,
          createdBy: updatedDiag.createdBy,
        };

        setDiagnostics((prev) =>
          prev.map((d) => (d.id === editingDiagnosis.id ? newDiagnosis : d))
        );
      } else {
        const createdDiag = await diagnosticsApi.create({
          patientId: patient.id,
          diagnosisName: diagnosisForm.diagnosisName,
          diagnosisCode: diagnosisForm.diagnosisCode || undefined,
          categoryId: diagnosisForm.categoryId || undefined,
          subcategoryId: diagnosisForm.subcategoryId || undefined,
          dateDiagnosed: diagnosisForm.dateDiagnosed,
          severity: diagnosisForm.severity as "mild" | "moderate" | "severe" | "critical",
          notes: diagnosisForm.notes || undefined,
          createdBy: diagnosisForm.createdBy || undefined,
        });

        newDiagnosis = {
          id: createdDiag.id,
          diagnosisName: createdDiag.diagnosisName,
          diagnosisCode: createdDiag.diagnosisCode,
          categoryId: createdDiag.categoryId,
          subcategoryId: createdDiag.subcategoryId,
          dateDiagnosed: createdDiag.dateDiagnosed,
          severity: createdDiag.severity,
          notes: createdDiag.notes,
          createdBy: createdDiag.createdBy,
        };

        setDiagnostics((prev) => [newDiagnosis, ...prev]);
      }

      setIsAddDiagnosisOpen(false);
      setEditingDiagnosis(null);
      alert(editingDiagnosis ? "Diagnosis updated successfully!" : "Diagnosis added successfully!");
    } catch (error) {
      console.error("Error saving diagnosis:", error);
      alert(
        error instanceof Error ? error.message : "Failed to save diagnosis"
      );
    }
  };

  return (
    <>
      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading patient details...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-12 text-center border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
          <Link to="/patients">
            <Button variant="outline" className="mt-4">
              Back to Patients
            </Button>
          </Link>
        </Card>
      )}

      {/* Patient Details */}
      {!loading && !error && patient && (
        <>
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
                  <p className="text-muted-foreground">
                    RUT: {patient.rut}
                  </p>
                </div>
                <Badge
                  variant={patient.status === "active" ? "default" : "secondary"}
                  className="w-fit"
                >
                  {patient.status === "active"
                    ? "Active Treatment"
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

          {/* Treatment Records Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Status:
            </span>
            <Badge
              variant={treatmentStatusFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTreatmentStatusFilter("all")}
            >
              All
            </Badge>
            <Badge
              variant={treatmentStatusFilter === "active" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTreatmentStatusFilter("active")}
            >
              Active
            </Badge>
            <Badge
              variant={treatmentStatusFilter === "finished" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTreatmentStatusFilter("finished")}
            >
              Finished
            </Badge>
            <Badge
              variant={treatmentStatusFilter === "suspended" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTreatmentStatusFilter("suspended")}
            >
              Suspended
            </Badge>
            <Badge
              variant={treatmentStatusFilter === "extended" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTreatmentStatusFilter("extended")}
            >
              Extended
            </Badge>

            <span className="ml-4 text-sm font-medium text-muted-foreground">
              Type:
            </span>
            <Badge
              variant={treatmentTypeFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTreatmentTypeFilter("all")}
            >
              All
            </Badge>
            <Badge
              variant={treatmentTypeFilter === "antibiotic" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTreatmentTypeFilter("antibiotic")}
            >
              Antibiotics
            </Badge>
            <Badge
              variant={treatmentTypeFilter === "corticoide" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTreatmentTypeFilter("corticoide")}
            >
              Corticoides
            </Badge>
          </div>

          <Card className="overflow-hidden">
            {treatmentRecords.length === 0 ? (
              <NoTreatmentsEmptyState
                onAddTreatment={() => setIsNewProgramOpen(true)}
              />
            ) : filteredTreatmentRecords.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  No treatments match the selected filters
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTreatmentRecords.map((record) => {
                  const daysRemaining =
                    record.programmedDays - record.daysApplied;
                  // Orange background ONLY for active treatments with exactly 1 day remaining
                  // Never apply orange to suspended, finished, or extended treatments
                  const isEndingSoon =
                    record.status === "active" && daysRemaining === 1;
                  return (
                    <div
                      key={record.id}
                      className={`p-4 ${isEndingSoon && record.status === "active" ? "bg-orange-500/10" : ""}`}
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

        {/* Add/Edit Diagnosis Dialog */}
        <Dialog open={isAddDiagnosisOpen} onOpenChange={setIsAddDiagnosisOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingDiagnosis ? "Edit Diagnosis" : "Add New Diagnosis"}
              </DialogTitle>
              <DialogDescription>
                Record a new diagnosis for this patient with ICD-10 code and severity.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                    setDiagnosisForm(prev => ({
                      ...prev,
                      categoryId: value,
                      subcategoryId: "",
                      diagnosisName: ""
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Select
                  value={diagnosisForm.subcategoryId}
                  onValueChange={(value) => {
                    const subcat = subcategories.find(s => s.id === value);
                    setDiagnosisForm(prev => ({
                      ...prev,
                      subcategoryId: value,
                      diagnosisName: subcat?.name || "",
                      diagnosisCode: subcat?.code || "",
                    }));
                  }}
                  disabled={!selectedCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCategoryId ? "First select a category..." : "Select a diagnosis..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((subcat) => (
                      <SelectItem key={subcat.id} value={subcat.id}>
                        {subcat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Severity</Label>
                <div className="flex gap-2">
                  {(["mild", "moderate", "severe", "critical"] as const).map(
                    (severity) => (
                      <Badge
                        key={severity}
                        variant={
                          diagnosisForm.severity === severity
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer ${
                          diagnosisForm.severity === severity
                            ? getSeverityBadgeColor(severity)
                            : ""
                        }`}
                        onClick={() =>
                          setDiagnosisForm((prev) => ({
                            ...prev,
                            severity,
                          }))
                        }
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Badge>
                    )
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateDiagnosed">Date Diagnosed</Label>
                <Input
                  id="dateDiagnosed"
                  type="date"
                  value={diagnosisForm.dateDiagnosed}
                  onChange={(e) =>
                    setDiagnosisForm((prev) => ({
                      ...prev,
                      dateDiagnosed: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Clinical Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any relevant clinical notes..."
                  value={diagnosisForm.notes}
                  onChange={(e) =>
                    setDiagnosisForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {diagnosisForm.notes.length}/500 characters
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="createdBy">Created By (Optional)</Label>
                <Input
                  id="createdBy"
                  placeholder="e.g., Dr. Smith"
                  value={diagnosisForm.createdBy}
                  onChange={(e) =>
                    setDiagnosisForm((prev) => ({
                      ...prev,
                      createdBy: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDiagnosisOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveDiagnosis}>
                {editingDiagnosis ? "Update" : "Add"} Diagnosis
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diagnostics Section */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Diagnostics
            </h2>
            <Button 
              className="gap-2"
              onClick={() => handleOpenDiagnosisDialog(null)}
            >
              <Plus className="h-4 w-4" />
              Add Diagnosis
            </Button>
          </div>
          
          <Card className="overflow-hidden">
            {diagnostics.length === 0 ? (
              <NoDiagnosticsEmptyState
                onAddDiagnostic={() => handleOpenDiagnosisDialog(null)}
              />
            ) : (
              <div className="divide-y divide-border">
                {diagnostics.map((diagnostic) => (
                  <div
                    key={diagnostic.id}
                    className="p-4"
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-bold text-foreground">
                            {diagnostic.diagnosisName}
                          </h3>
                          {diagnostic.categoryName && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                              {diagnostic.categoryName}
                            </Badge>
                          )}
                          {diagnostic.diagnosisCode && (
                            <Badge variant="secondary" className="text-xs">
                              {diagnostic.diagnosisCode}
                            </Badge>
                          )}
                          <Badge
                            className={getSeverityBadgeColor(diagnostic.severity)}
                          >
                            {diagnostic.severity.charAt(0).toUpperCase() + diagnostic.severity.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-6">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Date Diagnosed
                            </p>
                            <p className="font-semibold text-foreground">
                              {new Date(diagnostic.dateDiagnosed).toLocaleDateString()}
                            </p>
                          </div>
                          {diagnostic.createdBy && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Created By
                              </p>
                              <p className="font-semibold text-foreground">
                                {diagnostic.createdBy}
                              </p>
                            </div>
                          )}
                        </div>
                        {diagnostic.notes && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Clinical Notes
                            </p>
                            <p className="text-sm text-foreground">
                              {diagnostic.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDiagnosisDialog(diagnostic)}
                        className="gap-2 bg-transparent"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={async () => {
                           if (confirm(`Are you sure you want to delete the diagnosis "${diagnostic.diagnosisName}"?`)) {
                             try {
                               await diagnosticsApi.delete(diagnostic.id);
                               setDiagnostics(prev => prev.filter(d => d.id !== diagnostic.id));
                               alert("Diagnosis deleted successfully");
                             } catch (error) {
                               console.error("Error deleting diagnosis:", error);
                               alert("Failed to delete diagnosis");
                             }
                           }
                         }}
                         className="gap-2 bg-transparent text-red-600 hover:text-red-700"
                       >
                         <Trash2 className="h-4 w-4" />
                         Delete
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

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
              Antibiotic Treatment Timeline
            </h2>
            <AntibioticTimeline treatments={timelineTreatments} />
          </div>
        </>
      )}
    </>
  );
}
