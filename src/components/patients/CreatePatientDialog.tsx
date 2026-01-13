import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Patient, PatientStatus } from "@/models/Patients";
import type { Unit } from "@/models/Units";
import { unitsOptions } from "@/models/Units";
import { uciBeds, utiBeds } from "@/services/MockApi";
import { formatRut, validateRut } from "@/lib/rut";

interface CreatePatientDialogProps {
  onCreatePatient: (patient: Omit<Patient, "id">) => Promise<void>;
  existingPatients?: Patient[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreatePatientDialog({
  onCreatePatient,
  existingPatients = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreatePatientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled && controlledOnOpenChange) {
      controlledOnOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rut: "",
    name: "",
    age: "",
    status: "waiting" as PatientStatus,
    unit: "UCI" as Unit,
    bedNumber: "",
    hasEndingSoonProgram: false,
  });

  // Get all beds for the selected unit and calculate which are occupied
  const { unitBeds, occupiedBeds } = useMemo(() => {
    const allBeds = formData.unit === "UCI" ? uciBeds : utiBeds;
    
    // Get occupied beds in this unit
    const occupied = existingPatients
      .filter(p => p.unit === formData.unit && p.bedNumber)
      .map(p => p.bedNumber);
    
    return { unitBeds: allBeds, occupiedBeds: occupied };
  }, [formData.unit, existingPatients]);

  // Calculate available beds count
  const availableBedsCount = unitBeds.filter(bed => !occupiedBeds.includes(bed)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onCreatePatient({
        rut: formData.rut,
        name: formData.name,
        age: Number.parseInt(formData.age),
        status: formData.status,
        unit: formData.unit,
        bedNumber: Number.parseInt(formData.bedNumber),
        hasEndingSoonProgram: formData.hasEndingSoonProgram,
      });

      // Reset form and close dialog
      setFormData({
        rut: "",
        name: "",
        age: "",
        status: "waiting",
        unit: "UCI",
        bedNumber: "",
        hasEndingSoonProgram: false,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("Failed to create patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Enter the patient's information to add them to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                placeholder="12.345.678-9"
                value={formData.rut}
                onChange={(e) => {
                  const formatted = formatRut(e.target.value);
                  setFormData({ ...formData, rut: formatted });
                }}
                required
              />
              {formData.rut.length >= 8 && !validateRut(formData.rut) && (
                <p className="text-xs text-destructive">
                  Invalid RUT verification digit
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="María González Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
                min="0"
                max="150"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: PatientStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiting">Waiting for Treatment</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value: Unit) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitsOptions.filter((u) => u !== "all").map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bedNumber">Bed Number *</Label>
              <Select
                value={formData.bedNumber}
                onValueChange={(value) =>
                  setFormData({ ...formData, bedNumber: value })
                }
              >
                <SelectTrigger id="bedNumber">
                  <SelectValue placeholder="Select a bed" />
                </SelectTrigger>
                <SelectContent>
                  {unitBeds.map((bed) => {
                    const isOccupied = occupiedBeds.includes(bed);
                    return (
                      <SelectItem 
                        key={bed} 
                        value={bed.toString()}
                        disabled={isOccupied}
                        className={isOccupied ? "text-muted-foreground opacity-50" : ""}
                      >
                        Bed {bed} {isOccupied ? "(Occupied)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.unit === "UCI" ? "UCI beds: 1-17" : "UTI beds: 18-34"}
                {" • "}
                {availableBedsCount} bed{availableBedsCount !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
