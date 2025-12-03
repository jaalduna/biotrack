import { type Patient } from "./Patients";
export type UnitName =
  | "UCI"
  | "UTI"
  | "UTIM"
  | "MEDICINA"
  | "CIRUGIA"
  | "URGENCIAS"
  | "GINECOLOGIA"
  | "PENCIONADOS"
  | "HD";

export const unitsOptions: (UnitName | "all")[] = [
  "all",
  "UCI",
  "UTI",
  "UTIM",
  "MEDICINA",
  "CIRUGIA",
  "URGENCIAS",
  "GINECOLOGIA",
  "PENCIONADOS",
  "HD",
];

export interface Unit {
  name: UnitName;
  beds: Bed[];
}

export interface Bed {
  number: number;
  patientRut?: string;
  unit: UnitName;
}

export type ActiveBed = Bed & {
  unitName: string;
  patient: Patient;
};
