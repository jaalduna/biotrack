type MedicineType = "antibiotic" | "corticosteroid";

//medicine information
export interface Medicine {
  id: string;
  name: string;
  type: MedicineType;
  description?: string;
}

//single medicine prescription
export interface MedicinePrescription {
  medicineId: string;
  startDate: Date;
  duration: number; // in days
}

//group of individual medicine prescriptions
export interface Treatment {
  medicines: MedicinePrescription[];
}
