import type { Unit } from "./Units";

export interface Patient {
  id: string;
  rut: string;
  name: string;
  age: number;
  status: PatientStatus;
  unit: Unit;
  bedNumber: number;
  hasEndingSoonProgram?: boolean;
}

export type PatientStatus = "waiting" | "active" | "archived";
