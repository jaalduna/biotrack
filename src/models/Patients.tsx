export interface Patient {
  id: string;
  rut: string;
  name: string;
  age: number;
  status: PatientStatus;
  unit: string; // Dynamic unit from API
  bedNumber: number;
  hasEndingSoonProgram?: boolean;
}

export type PatientStatus = "waiting" | "active" | "archived";
