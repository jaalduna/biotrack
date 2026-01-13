import type { Patient } from "@/models/Patients";
import type { Unit } from "@/models/Units";

// Runtime config interface (injected by docker-entrypoint.sh in production)
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      API_BASE_URL: string;
    };
  }
}

// Get API URL: prefer runtime config, then build-time config, then default
function getApiBaseUrl(): string {
  // Runtime config (production Docker)
  if (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.API_BASE_URL) {
    return window.__RUNTIME_CONFIG__.API_BASE_URL;
  }
  // Build-time config (Vite)
  if (typeof __API_BASE_URL__ !== "undefined") {
    return __API_BASE_URL__;
  }
  // Default fallback
  return "http://localhost:8000/api/v1";
}

// Declare the build-time constant
declare const __API_BASE_URL__: string | undefined;

const API_BASE_URL = getApiBaseUrl();

function isBetaMode(): boolean {
  return localStorage.getItem("biotrack_beta_mode") === "true";
}

// Auth helper function
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("biotrack_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

// Helper to extract detailed error messages from API responses
async function handleApiError(response: Response): Promise<never> {
  let errorMessage = "An error occurred";
  
  try {
    const errorData = await response.json();
    if (errorData.detail) {
      errorMessage = errorData.detail;
    }
  } catch {
    // If response isn't JSON, use status text
    errorMessage = response.statusText || `Error ${response.status}`;
  }
  
  throw new Error(errorMessage);
}

// API Response types (snake_case from backend)
interface PatientApiResponse {
  id: string;
  rut: string;
  name: string;
  age: number;
  status: "waiting" | "active" | "archived";
  unit: string;
  bed_number: number;
  has_ending_soon_program: boolean;
  created_at: string;
  updated_at: string;
}

interface UnitApiResponse {
  id: string;
  name: string;
  description?: string;
}

interface BedApiResponse {
  id: string;
  unit_id: string;
  bed_number: number;
  is_occupied: boolean;
  created_at: string;
}

interface DiagnosticApiResponse {
  id: string;
  patient_id: string;
  diagnosis_name: string;
  diagnosis_code?: string;
  category_id?: string;
  subcategory_id?: string;
  date_diagnosed: string;
  severity: "mild" | "moderate" | "severe" | "critical";
  notes?: string;
  created_by?: string;
}

export interface Diagnostic {
  id: string;
  patientId: string;
  diagnosisName: string;
  diagnosisCode?: string;
  categoryId?: string;
  subcategoryId?: string;
  dateDiagnosed: string;
  severity: "mild" | "moderate" | "severe" | "critical";
  notes?: string;
  createdBy?: string;
}

interface DiagnosticCategoryApiResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface DiagnosticSubcategoryApiResponse {
  id: string;
  category_id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticSubcategory {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// Transform backend snake_case to frontend camelCase
function transformPatient(apiPatient: PatientApiResponse): Patient {
  return {
    id: apiPatient.id,
    rut: apiPatient.rut,
    name: apiPatient.name,
    age: apiPatient.age,
    status: apiPatient.status,
    unit: apiPatient.unit as Unit,
    bedNumber: apiPatient.bed_number,
    hasEndingSoonProgram: apiPatient.has_ending_soon_program,
  };
}

// Transform frontend camelCase to backend snake_case
function transformPatientToApi(patient: Partial<Patient>): Partial<PatientApiResponse> {
  return {
    rut: patient.rut,
    name: patient.name,
    age: patient.age,
    status: patient.status,
    unit: patient.unit,
    bed_number: patient.bedNumber,
    has_ending_soon_program: patient.hasEndingSoonProgram,
  };
}

function transformDiagnostic(apiDiagnostic: DiagnosticApiResponse): Diagnostic {
  return {
    id: apiDiagnostic.id,
    patientId: apiDiagnostic.patient_id,
    diagnosisName: apiDiagnostic.diagnosis_name,
    diagnosisCode: apiDiagnostic.diagnosis_code,
    categoryId: apiDiagnostic.category_id,
    subcategoryId: apiDiagnostic.subcategory_id,
    dateDiagnosed: apiDiagnostic.date_diagnosed,
    severity: apiDiagnostic.severity,
    notes: apiDiagnostic.notes,
    createdBy: apiDiagnostic.created_by,
  };
}

function transformDiagnosticToApi(diagnostic: Partial<Diagnostic>): any {
  return {
    patient_id: diagnostic.patientId,
    diagnosis_name: diagnostic.diagnosisName,
    diagnosis_code: diagnostic.diagnosisCode,
    category_id: diagnostic.categoryId,
    subcategory_id: diagnostic.subcategoryId,
    date_diagnosed: diagnostic.dateDiagnosed,
    severity: diagnostic.severity,
    notes: diagnostic.notes,
    created_by: diagnostic.createdBy,
  };
}

function transformDiagnosticCategory(apiCategory: DiagnosticCategoryApiResponse): DiagnosticCategory {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    code: apiCategory.code,
    description: apiCategory.description,
    isActive: apiCategory.is_active,
    sortOrder: apiCategory.sort_order,
  };
}

function transformDiagnosticSubcategory(apiSubcategory: DiagnosticSubcategoryApiResponse): DiagnosticSubcategory {
  return {
    id: apiSubcategory.id,
    categoryId: apiSubcategory.category_id,
    name: apiSubcategory.name,
    code: apiSubcategory.code,
    description: apiSubcategory.description,
    isActive: apiSubcategory.is_active,
    sortOrder: apiSubcategory.sort_order,
  };
}

// Patients API
export const patientsApi = {
  async getAll(): Promise<Patient[]> {
    if (isBetaMode()) {
      return mockPatients;
    }
    
    const response = await fetch(`${API_BASE_URL}/patients`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch patients");
    const data: PatientApiResponse[] = await response.json();
    return data.map(transformPatient);
  },

  async getById(id: string): Promise<Patient> {
    if (isBetaMode()) {
      const patient = mockPatients.find(p => p.id === id);
      if (!patient) throw new Error("Patient not found");
      return patient;
    }
    
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch patient");
    const data: PatientApiResponse = await response.json();
    return transformPatient(data);
  },

  async create(patient: Omit<Patient, "id">): Promise<Patient> {
    if (isBetaMode()) {
      const newPatient: Patient = {
        ...patient,
        id: Date.now().toString(),
      };
      mockPatients.push(newPatient);
      return newPatient;
    }
    
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(transformPatientToApi(patient)),
    });
    if (!response.ok) throw new Error("Failed to create patient");
    const data: PatientApiResponse = await response.json();
    return transformPatient(data);
  },

  async update(id: string, patient: Partial<Patient>): Promise<Patient> {
    if (isBetaMode()) {
      const index = mockPatients.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Patient not found");
      mockPatients[index] = { ...mockPatients[index], ...patient };
      return mockPatients[index];
    }
    
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(transformPatientToApi(patient)),
    });
    if (!response.ok) throw new Error("Failed to update patient");
    const data: PatientApiResponse = await response.json();
    return transformPatient(data);
  },

  async delete(id: string): Promise<void> {
    if (isBetaMode()) {
      const index = mockPatients.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Patient not found");
      mockPatients.splice(index, 1);
      return;
    }
    
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete patient");
  },

  async getByRut(rut: string): Promise<Patient | null> {
    const patients = await this.getAll();
    return patients.find((p) => p.rut === rut) || null;
  },
};

// Units API
export const unitsApi = {
  async getAll(): Promise<UnitApiResponse[]> {
    if (isBetaMode()) {
      return mockUnits;
    }
    
    const response = await fetch(`${API_BASE_URL}/units`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch units");
    return response.json();
  },

  async create(name: string, description?: string): Promise<UnitApiResponse> {
    if (isBetaMode()) {
      const newUnit: UnitApiResponse = {
        id: Date.now().toString(),
        name,
        description,
      };
      mockUnits.push(newUnit);
      return newUnit;
    }
    
    const response = await fetch(`${API_BASE_URL}/units`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) throw new Error("Failed to create unit");
    return response.json();
  },
};

// Beds API
export const bedsApi = {
  async getAll(): Promise<BedApiResponse[]> {
    const response = await fetch(`${API_BASE_URL}/beds`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch beds");
    return response.json();
  },

  async create(unitId: string, bedNumber: number): Promise<BedApiResponse> {
    const response = await fetch(`${API_BASE_URL}/beds`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ unit_id: unitId, bed_number: bedNumber, is_occupied: false }),
    });
    if (!response.ok) throw new Error("Failed to create bed");
    return response.json();
  },
};

// Diagnostics API
export const diagnosticsApi = {
  async getAll(): Promise<Diagnostic[]> {
    if (isBetaMode()) {
      return mockDiagnostics.map(transformDiagnostic);
    }
    
    const response = await fetch(`${API_BASE_URL}/diagnostics`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch diagnostics");
    const data: DiagnosticApiResponse[] = await response.json();
    return data.map(transformDiagnostic);
  },

  async getByPatientId(patientId: string): Promise<Diagnostic[]> {
    if (isBetaMode()) {
      const patientDiagnostics = mockDiagnostics
        .filter(d => d.patient_id === patientId)
        .map(transformDiagnostic);
      return patientDiagnostics;
    }
    
    const response = await fetch(`${API_BASE_URL}/diagnostics?patient_id=${patientId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch diagnostics for patient");
    const data: DiagnosticApiResponse[] = await response.json();
    return data.map(transformDiagnostic);
  },

  async getById(id: string): Promise<Diagnostic> {
    if (isBetaMode()) {
      const diagnostic = mockDiagnostics.find(d => d.id === id);
      if (!diagnostic) throw new Error("Diagnostic not found");
      return transformDiagnostic(diagnostic);
    }
    
    const response = await fetch(`${API_BASE_URL}/diagnostics/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch diagnostic");
    const data: DiagnosticApiResponse = await response.json();
    return transformDiagnostic(data);
  },

  async create(diagnostic: Omit<Diagnostic, "id">): Promise<Diagnostic> {
    if (isBetaMode()) {
      const newDiagnostic: DiagnosticApiResponse = {
        ...transformDiagnosticToApi(diagnostic),
        id: Date.now().toString(),
      };
      mockDiagnostics.push(newDiagnostic);
      return transformDiagnostic(newDiagnostic);
    }
    
    const response = await fetch(`${API_BASE_URL}/diagnostics`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(transformDiagnosticToApi(diagnostic)),
    });
    if (!response.ok) throw new Error("Failed to create diagnostic");
    const data: DiagnosticApiResponse = await response.json();
    return transformDiagnostic(data);
  },

  async update(id: string, diagnostic: Partial<Diagnostic>): Promise<Diagnostic> {
    if (isBetaMode()) {
      const index = mockDiagnostics.findIndex(d => d.id === id);
      if (index === -1) throw new Error("Diagnostic not found");
      mockDiagnostics[index] = { 
        ...mockDiagnostics[index], 
        ...transformDiagnosticToApi(diagnostic) 
      };
      return transformDiagnostic(mockDiagnostics[index]);
    }
    
    const response = await fetch(`${API_BASE_URL}/diagnostics/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(transformDiagnosticToApi(diagnostic)),
    });
    if (!response.ok) throw new Error("Failed to update diagnostic");
    const data: DiagnosticApiResponse = await response.json();
    return transformDiagnostic(data);
  },

  async delete(id: string): Promise<void> {
    if (isBetaMode()) {
      const index = mockDiagnostics.findIndex(d => d.id === id);
      if (index === -1) throw new Error("Diagnostic not found");
      mockDiagnostics.splice(index, 1);
      return;
    }
    
    const response = await fetch(`${API_BASE_URL}/diagnostics/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete diagnostic");
  },
};

export const diagnosticCategoriesApi = {
  async getAll(): Promise<DiagnosticCategory[]> {
    const response = await fetch(`${API_BASE_URL}/diagnostic-categories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch diagnostic categories");
    const data: DiagnosticCategoryApiResponse[] = await response.json();
    return data.map(transformDiagnosticCategory);
  },

  async getSubcategoriesByCategory(categoryId: string): Promise<DiagnosticSubcategory[]> {
    const response = await fetch(`${API_BASE_URL}/diagnostic-subcategories?category_id=${categoryId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch subcategories");
    const data: DiagnosticSubcategoryApiResponse[] = await response.json();
    return data.map(transformDiagnosticSubcategory);
  },
};

export const treatmentsApi = {
  async getByPatientId(patientId: string): Promise<Treatment[]> {
    if (isBetaMode()) {
      return mockTreatments
        .filter(t => t.patient_id === patientId)
        .map(transformTreatment);
    }
    
    const response = await fetch(`${API_BASE_URL}/treatments?patient_id=${patientId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch treatments");
    const data: TreatmentApiResponse[] = await response.json();
    return data.map(transformTreatment);
  },

  async create(treatment: Omit<Treatment, "id" | "createdAt" | "updatedAt">): Promise<Treatment> {
    if (isBetaMode()) {
      const now = new Date().toISOString();
      const newTreatment: TreatmentApiResponse = {
        ...transformTreatmentToApi(treatment),
        id: Date.now().toString(),
        created_at: now,
        updated_at: now,
      };
      mockTreatments.push(newTreatment);
      return transformTreatment(newTreatment);
    }
    
    const response = await fetch(`${API_BASE_URL}/treatments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(transformTreatmentToApi(treatment)),
    });
    if (!response.ok) throw new Error("Failed to create treatment");
    const data: TreatmentApiResponse = await response.json();
    return transformTreatment(data);
  },

  async update(id: string, treatment: Partial<Treatment>): Promise<Treatment> {
    if (isBetaMode()) {
      const index = mockTreatments.findIndex(t => t.id === id);
      if (index === -1) throw new Error("Treatment not found");
      mockTreatments[index] = {
        ...mockTreatments[index],
        ...transformTreatmentToApi(treatment),
        updated_at: new Date().toISOString(),
      };
      return transformTreatment(mockTreatments[index]);
    }
    
    const response = await fetch(`${API_BASE_URL}/treatments/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(transformTreatmentToApi(treatment)),
    });
    if (!response.ok) throw new Error("Failed to update treatment");
    const data: TreatmentApiResponse = await response.json();
    return transformTreatment(data);
  },

  async delete(id: string): Promise<void> {
    if (isBetaMode()) {
      const index = mockTreatments.findIndex(t => t.id === id);
      if (index === -1) throw new Error("Treatment not found");
      mockTreatments.splice(index, 1);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/treatments/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete treatment");
  },

  async applyDay(id: string): Promise<Treatment> {
    // Get current treatment to increment daysApplied
    if (isBetaMode()) {
      const index = mockTreatments.findIndex(t => t.id === id);
      if (index === -1) throw new Error("Treatment not found");
      const treatment = mockTreatments[index];
      const newDaysApplied = treatment.days_applied + 1;

      // Check if treatment should be marked as finished
      const newStatus = newDaysApplied >= treatment.programmed_days ? "finished" : treatment.status;

      mockTreatments[index] = {
        ...treatment,
        days_applied: newDaysApplied,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      return transformTreatment(mockTreatments[index]);
    }

    // For real API, we need to get current treatment first and then update
    const getResponse = await fetch(`${API_BASE_URL}/treatments/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!getResponse.ok) throw new Error("Failed to fetch treatment");
    const current: TreatmentApiResponse = await getResponse.json();

    const newDaysApplied = current.days_applied + 1;
    const newStatus = newDaysApplied >= current.programmed_days ? "finished" : current.status;

    const response = await fetch(`${API_BASE_URL}/treatments/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...current,
        days_applied: newDaysApplied,
        status: newStatus,
      }),
    });
    if (!response.ok) throw new Error("Failed to apply day");
    const data: TreatmentApiResponse = await response.json();
    return transformTreatment(data);
  },
};

// Team API Types
export interface Team {
  id: string;
  name: string;
  subscription_status: "trial" | "active" | "cancelled" | "expired";
  subscription_plan: "basic" | "premium" | null;
  member_limit: number;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  team_role: "owner" | "admin" | "member";
  created_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  invited_by: string;
  role: "admin" | "member";
  token: string;
  expires_at: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  created_at: string;
}

// User type (for invitation acceptance)
export interface User {
  id: string;
  name: string;
  email: string;
  role: "basic" | "advanced";
  team_id: string | null;
  team_role: "owner" | "admin" | "member" | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}



// Invitations API
export const invitationsApi = {
  async send(teamId: string, email: string, role: "admin" | "member"): Promise<TeamInvitation> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/invitations`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }),
    });
    if (!response.ok) throw new Error("Failed to send invitation");
    return response.json();
  },

  async list(teamId: string): Promise<TeamInvitation[]> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/invitations`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch invitations");
    return response.json();
  },

  async cancel(teamId: string, invitationId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/invitations/${invitationId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to cancel invitation");
  },

  async getByToken(token: string): Promise<TeamInvitation> {
    const response = await fetch(`${API_BASE_URL}/invitations/${token}`);
    if (!response.ok) throw new Error("Failed to fetch invitation");
    return response.json();
  },

  async accept(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/invitations/${token}/accept`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  async acceptAndRegister(
    token: string,
    userData: { name: string; email: string; password: string; role?: string }
  ): Promise<{ access_token: string; token_type: string; user: User }> {
    const response = await fetch(
      `${API_BASE_URL}/invitations/${token}/accept-and-register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      }
    );
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};

// Treatment API types
interface TreatmentApiResponse {
  id: string;
  patient_id: string;
  antibiotic_name: string;
  antibiotic_type: "antibiotic" | "corticoide";
  start_date: string;
  days_applied: number;
  programmed_days: number;
  status: "active" | "suspended" | "extended" | "finished";
  start_count: 0 | 1;
  dosage?: string;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  patientId: string;
  antibioticName: string;
  antibioticType: "antibiotic" | "corticoide";
  startDate: string;
  daysApplied: number;
  programmedDays: number;
  status: "active" | "suspended" | "extended" | "finished";
  startCount: 0 | 1;
  dosage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BedHistory {
  id: string;
  patientId: string;
  bedId: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

// Transform treatment from API to frontend format
function transformTreatment(apiTreatment: TreatmentApiResponse): Treatment {
  return {
    id: apiTreatment.id,
    patientId: apiTreatment.patient_id,
    antibioticName: apiTreatment.antibiotic_name,
    antibioticType: apiTreatment.antibiotic_type,
    startDate: apiTreatment.start_date,
    daysApplied: apiTreatment.days_applied,
    programmedDays: apiTreatment.programmed_days,
    status: apiTreatment.status,
    startCount: apiTreatment.start_count,
    dosage: apiTreatment.dosage,
    createdAt: apiTreatment.created_at,
    updatedAt: apiTreatment.updated_at,
  };
}

// Transform treatment from frontend to API format
function transformTreatmentToApi(treatment: Partial<Treatment>): any {
  return {
    patient_id: treatment.patientId,
    antibiotic_name: treatment.antibioticName,
    antibiotic_type: treatment.antibioticType,
    start_date: treatment.startDate,
    days_applied: treatment.daysApplied || 0,
    programmed_days: treatment.programmedDays,
    status: treatment.status,
    start_count: treatment.startCount,
    dosage: treatment.dosage,
  };
}

let mockPatients: Patient[] = [
  {
    id: "1",
    rut: "12.345.678-9",
    name: "John Doe",
    age: 45,
    status: "active",
    unit: "UCI",
    bedNumber: 1,
    hasEndingSoonProgram: false,
  },
  {
    id: "2",
    rut: "98.765.432-1",
    name: "Jane Smith",
    age: 32,
    status: "waiting",
    unit: "UTI",
    bedNumber: 2,
    hasEndingSoonProgram: true,
  },
];

let mockUnits: UnitApiResponse[] = [
  { id: "1", name: "ICU-A", description: "Intensive Care Unit A" },
  { id: "2", name: "ICU-B", description: "Intensive Care Unit B" },
];

let mockDiagnostics: DiagnosticApiResponse[] = [
  {
    id: "1",
    patient_id: "1",
    diagnosis_name: "Pneumonia",
    diagnosis_code: "J18.9",
    date_diagnosed: "2024-01-15",
    severity: "moderate",
    notes: "Community-acquired pneumonia",
    created_by: "Dr. Smith"
  },
];

let mockTreatments: TreatmentApiResponse[] = [
  {
    id: "1",
    patient_id: "1",
    antibiotic_name: "Amoxicillin",
    antibiotic_type: "antibiotic",
    start_date: "2024-01-15",
    days_applied: 5,
    programmed_days: 7,
    status: "active",
    start_count: 1,
    dosage: "500mg 3x daily",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T10:00:00Z"
  },
];

export const teamsApi = {
  async get(teamId: string): Promise<Team> {
    if (isBetaMode()) {
      return {
        id: "beta_team_001",
        name: "Beta Test Team",
        subscription_status: "active",
        subscription_plan: "premium",
        member_limit: 100,
        trial_ends_at: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        created_at: new Date().toISOString(),
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch team");
    return response.json();
  },

  async create(name: string): Promise<Team> {
    if (isBetaMode()) {
      throw new Error("Team creation not available in beta mode");
    }
    
    const response = await fetch(`${API_BASE_URL}/teams/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error("Failed to create team");
    return response.json();
  },

  async update(teamId: string, name: string): Promise<Team> {
    if (isBetaMode()) {
      throw new Error("Team updates not available in beta mode");
    }
    
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error("Failed to update team");
    return response.json();
  },

  async getMembers(teamId: string): Promise<TeamMember[]> {
    if (isBetaMode()) {
      const user = JSON.parse(localStorage.getItem("biotrack_user") || "{}");
      return [{
        id: user.id,
        name: user.name,
        email: user.email,
        team_role: "member",
        created_at: new Date().toISOString(),
      }];
    }
    
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch team members");
    return response.json();
  },

  async updateMemberRole(teamId: string, userId: string, role: "admin" | "member"): Promise<TeamMember> {
    if (isBetaMode()) {
      throw new Error("Team member management not available in beta mode");
    }
    
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members/${userId}/role`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!response.ok) throw new Error("Failed to update member role");
    return response.json();
  },

  async removeMember(teamId: string, userId: string): Promise<void> {
    if (isBetaMode()) {
      throw new Error("Team member management not available in beta mode");
    }
    
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to remove member");
  },

  async leave(): Promise<{ message: string }> {
    if (isBetaMode()) {
      throw new Error("Team leaving not available in beta mode");
    }
    
    const response = await fetch(`${API_BASE_URL}/teams/leave`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  async transferOwnership(teamId: string, newOwnerId: string): Promise<{ message: string }> {
    if (isBetaMode()) {
      throw new Error("Team ownership transfer not available in beta mode");
    }
    
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/transfer-ownership`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_owner_id: newOwnerId }),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};

// Subscriptions API
export const subscriptionsApi = {
  async createCheckout(plan: "basic" | "premium"): Promise<{ url: string }> {
    if (isBetaMode()) {
      throw new Error("Subscriptions not available in beta mode - all features are enabled");
    }
    
    const response = await fetch(`${API_BASE_URL}/subscriptions/checkout?plan=${plan}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to create checkout session");
    return response.json();
  },

  async createPortal(): Promise<{ url: string }> {
    if (isBetaMode()) {
      throw new Error("Subscriptions not available in beta mode - all features are enabled");
    }
    
    const response = await fetch(`${API_BASE_URL}/subscriptions/portal`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to create portal session");
    return response.json();
  },

  async getStatus(): Promise<{
    subscription_status: string;
    subscription_plan: string | null;
    trial_ends_at: string | null;
  }> {
    if (isBetaMode()) {
      return {
        subscription_status: "active",
        subscription_plan: "premium",
        trial_ends_at: null,
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/subscriptions/status`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch subscription status");
    return response.json();
  },

  async downgrade(): Promise<void> {
    if (isBetaMode()) {
      throw new Error("Subscriptions not available in beta mode - all features are enabled");
    }
    
    const response = await fetch(`${API_BASE_URL}/subscriptions/downgrade`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to downgrade subscription");
    }
  },
};

export interface Antibiotic {
  id: string;
  name: string;
  type: "antibiotic" | "corticoide";
  default_start_count: 0 | 1;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const antibioticsApi = {
  getAll: async (): Promise<Antibiotic[]> => {
    const response = await fetch(`${API_BASE_URL}/antibiotics`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch antibiotics");
    return response.json();
  },
};

export interface BedConfiguration {
  id: string;
  unit: Unit;
  bedCount: number;
  startNumber: number;
  endNumber: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export const bedConfigApi = {
  getAll: async (): Promise<BedConfiguration[]> => {
    const response = await fetch(`${API_BASE_URL}/bed-configurations`, {
      headers: getAuthHeaders(),
    });
    const result: ApiResponse<BedConfiguration[]> = await response.json();
    return result.data || [];
  },

  getById: async (id: string): Promise<BedConfiguration | null> => {
    const response = await fetch(`${API_BASE_URL}/bed-configurations/${id}`, {
      headers: getAuthHeaders(),
    });
    const result: ApiResponse<BedConfiguration> = await response.json();
    return result.data || null;
  },

  create: async (config: Omit<BedConfiguration, 'id'>): Promise<BedConfiguration> => {
    const response = await fetch(`${API_BASE_URL}/bed-configurations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    const result: ApiResponse<BedConfiguration> = await response.json();
    return result.data!;
  },

  update: async (id: string, config: Partial<BedConfiguration>): Promise<BedConfiguration> => {
    const response = await fetch(`${API_BASE_URL}/bed-configurations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    const result: ApiResponse<BedConfiguration> = await response.json();
    return result.data!;
  },

  delete: async (id: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/bed-configurations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};