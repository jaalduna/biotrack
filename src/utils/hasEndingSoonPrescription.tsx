import type { MedicinePrescription } from "@/models/Medicines";
import type { Patient } from "@/models/Patients";

// const hasTreatment = Boolean(treatment);
export const hasEndingSoonPrescription = (patient: Patient) => {
  if (!patient.treatment) {
    return false;
  }

  return patient.treatment.medicines.some(
    (prescription: MedicinePrescription) => {
      const endDate = new Date(prescription.startDate);
      const durationDays = prescription.duration;
      const diffDays =
        Math.ceil(endDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24);

      return diffDays <= durationDays - 1;
    },
  );
};
