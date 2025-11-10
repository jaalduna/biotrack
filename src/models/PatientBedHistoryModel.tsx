export interface PatientBedHistoryModel {
  patientRut: string;
  unitName: string;
  bedNumber: number;
  assignedAt: string; // ISO date string
  dischargedAt?: string; // timestamp or null if still assigned
}
