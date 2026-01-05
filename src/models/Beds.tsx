import type { Unit } from "./Units";

export interface Bed {
  id: string;
  number: number;
  unit: Unit;
  status: BedStatus;
  patientId?: string;
}

export type BedStatus = "available" | "occupied" | "maintenance" | "reserved";

export interface BedConfiguration {
  id: string;
  unit: Unit;
  bedCount: number;
  startNumber: number;
  endNumber: number;
}