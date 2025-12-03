import { hasEndingSoonPrescription } from "../hasEndingSoonPrescription";
import type { Patient } from "@/models/Patients";
import type { MedicinePrescription } from "@/models/Medicines";

//TODO: install jest and test the function
describe("hasEndingSoonPrescription", () => {
  const basePrescription: MedicinePrescription = {
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    duration: 3,
    // ...other required fields
  } as MedicinePrescription;

  const patientWithEndingSoon: Patient = {
    treatment: {
      medicines: [basePrescription],
    },
    // ...other required fields
  } as Patient;

  const patientWithoutEndingSoon: Patient = {
    treatment: {
      medicines: [
        {
          ...basePrescription,
          startDate: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 10 days ago
          duration: 3,
        },
      ],
    },
    // ...other required fields
  } as Patient;

  it("returns true if a prescription is ending soon", () => {
    expect(hasEndingSoonPrescription(patientWithEndingSoon)).toBe(true);
  });

  it("returns false if no prescription is ending soon", () => {
    expect(hasEndingSoonPrescription(patientWithoutEndingSoon)).toBe(false);
  });

  it("returns false if patient has no treatment", () => {
    expect(hasEndingSoonPrescription({} as Patient)).toBe(false);
  });
});
