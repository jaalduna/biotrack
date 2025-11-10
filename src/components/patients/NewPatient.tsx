import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";
import type { Unit } from "@/models/Units";
import type { Patient, PatientStatus } from "@/models/Patients";

export interface NewPatientInterface {
  isAddPatientOpen: boolean;
}
export const NewPatient = ({ isAddPatientOpen }: NewPatientInterface) => {
  // const [newPatientRut, setNewPatientRut] = useState("");
  // const [newPatientName, setNewPatientName] = useState("");
  // const [unit, setUnit] = useState<Unit>("UCI");
  // const [bed, setBed] = useState();

  const defaultPatient: Patient = {
    rut: "",
    name: "",
    age: 0,
    status: "waiting",
    unit: "UCI",
  };
  PatientStatus;
  const [newPatient, setNewPatient] = useState();

  // export interface Patient {
  //   id: string;
  //   rut: string;
  //   name: string;
  //   age: number;
  //   status: PatientStatus;
  //   unit: Unit;
  //   bedNumber: number;
  //   hasEndingSoonProgram?: boolean;
  // }

  return (
    <Dialog open={isAddPatientOpen}>
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
              value={newPatient.rut}
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
              value={unit}
              onValueChange={(value) => setUnit(value as Unit)}
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
            <Select value={newPatientBed} onValueChange={setNewPatientBed}>
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
          <Button variant="outline" onClick={() => setIsAddPatientOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddPatient}>Add Patient</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
