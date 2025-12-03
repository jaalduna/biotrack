import { hasEndingSoonPrescription } from "@/components/patients/PatientResumeCard";

describe("hasEndingSoonPrescription", () => {
  it("returns false if treatment is undefined", () => {
    expect(hasEndingSoonPrescription(undefined)).toBeFalsy();
  });

  it("returns true if a prescription is ending soon", () => {
    const today = new Date();
    const prescription = {
      startDate: today,
      duration: 1,
    };
    const treatment = { medicines: [prescription] };
    expect(hasEndingSoonPrescription(treatment)).toBeTruthy();
  });

  it("returns false if no prescription is ending soon", () => {
    const prescription = {
      startDate: new Date("2025-01-01"),
      duration: 10,
    };
    const treatment = { medicines: [prescription] };
    expect(hasEndingSoonPrescription(treatment)).toBeFalsy();
  });
});
