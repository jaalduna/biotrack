import type { Patient, PatientStatus } from "@/models/Patients";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useUnits } from "@/contexts/UnitsContext";
import { getBedsByUnitName } from "@/config/units.config";

type EditPatientProps = {
  patient: Patient;
  onSave: (updated: Patient) => void;
  allPatients?: Patient[]; // To determine occupied beds
};

export const EditPatient: React.FC<EditPatientProps> = ({
  patient,
  onSave,
  allPatients = [],
}) => {
  const [form, setForm] = useState<Patient>(patient);
  const [isSaving, setIsSaving] = useState(false);
  const { unitNames } = useUnits();

  useEffect(() => {
    setForm(patient);
  }, [patient]);

  // Get all beds for the selected unit and calculate which are occupied
  const { allBeds: unitBeds, occupiedBeds } = useMemo(() => {
    const allBeds = getBedsByUnitName(form.unit);

    // Get occupied beds in this unit (excluding current patient's bed)
    const occupied = allPatients
      .filter(p => p.unit === form.unit && p.id !== patient.id && p.bedNumber)
      .map(p => p.bedNumber);

    return { allBeds, occupiedBeds: occupied };
  }, [form.unit, allPatients, patient.id]);

  // Calculate available beds count
  const availableBedsCount = unitBeds.filter(bed => !occupiedBeds.includes(bed)).length;

  // Reset bed number when unit changes if bed is not available in new unit
  useEffect(() => {
    const allBedsInUnit = getBedsByUnitName(form.unit);
    if (form.bedNumber && !allBedsInUnit.includes(form.bedNumber)) {
      // Set to first available bed in the new unit
      const firstAvailable = allBedsInUnit.find(bed => !occupiedBeds.includes(bed));
      setForm((prev) => ({ ...prev, bedNumber: firstAvailable || allBedsInUnit[0] }));
    }
  }, [form.unit, form.bedNumber, occupiedBeds]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "age" || name === "bedNumber" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    Promise.resolve(onSave(form)).finally(() => {
      setIsSaving(false);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rut">RUT</Label>
          <Input
            id="rut"
            name="rut"
            value={form.rut}
            onChange={handleChange}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">RUT cannot be changed</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="María González Pérez"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            name="age"
            type="number"
            placeholder="25"
            value={form.age}
            onChange={handleChange}
            required
            min="0"
            max="150"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={form.status}
            onValueChange={(value: PatientStatus) =>
              setForm({ ...form, status: value })
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
            value={form.unit}
            onValueChange={(value: string) => setForm({ ...form, unit: value })}
          >
            <SelectTrigger id="unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitNames.map((unit) => (
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
            value={form.bedNumber?.toString() || ""}
            onValueChange={(value) =>
              setForm({ ...form, bedNumber: Number(value) })
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
            {unitBeds.length > 0
              ? `${form.unit} beds: ${unitBeds[0]}-${unitBeds[unitBeds.length - 1]}`
              : "No beds configured for this unit"}
            {" • "}
            {availableBedsCount} bed{availableBedsCount !== 1 ? "s" : ""} available
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasEndingSoonProgram"
            checked={form.hasEndingSoonProgram}
            onCheckedChange={(checked) =>
              setForm({ ...form, hasEndingSoonProgram: checked as boolean })
            }
          />
          <Label
            htmlFor="hasEndingSoonProgram"
            className="text-sm font-normal cursor-pointer"
          >
            Treatment ending soon (1 day left)
          </Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};
