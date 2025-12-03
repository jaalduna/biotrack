import type { Patient } from "@/models/Patients";
import { useQuery } from "@tanstack/react-query";

const patients: Patient[] = [
  { rut: "12345678-9", name: "Juan Perez", age: 45, status: "waiting" },
  {
    rut: "98765432-1",
    name: "María Gómez",
    age: 60,
    status: "active",
    treatment: {
      medicines: [
        {
          medicineId: "med-001",
          duration: 3,
          startDate: new Date("2025-11-11"),
        },
        {
          medicineId: "med-003",
          duration: 5,
          startDate: new Date("2025-11-11"),
        },
      ],
    },
  },
];

// Mock fetch function for /patients endpoint
const fetchPatients = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return patients;
};

// Custom hook using TanStack Query
export function useMockPatientsQuery() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });
}
