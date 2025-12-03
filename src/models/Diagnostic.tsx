export interface Diagnostic {
  id: string;
  description: string;
}

export interface PatientDiagnostic {
  id: string;
  patientRut: string;
  diagnosticId: string;
  date: Date;
  notes?: string;
}
