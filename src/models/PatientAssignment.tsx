import type { Patient } from "./Patients";
import type { Bed } from "./Units";

export interface PatientAssignment {
  patient: Patient;
  bed: Bed;
}
