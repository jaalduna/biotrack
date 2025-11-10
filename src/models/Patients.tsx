import type { Unit } from "./Units";

export interface Patient {
  rut: string;
  name: string;
  age: number;
  status: PatientStatus;
  unit: Unit;
  bedNumber?: number;
  // hasEndingSoonProgram?: boolean;
}

// waiting: waiting for new treatment
// active: receiving its treatment
// warning: close to end of treatment
// archived: patient have left the hospital
export type PatientStatus = "waiting" | "active" | "warning" | "archived";
