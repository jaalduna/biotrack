import { useQuery } from "@tanstack/react-query";
import type { Unit } from "@/models/Units";

export const units: Unit[] = [
  {
    name: "UCI",
    beds: Array.from({ length: 7 }, (_, i) => ({ number: i + 1, unit: "UCI" })),
  },
  {
    name: "UTI",
    beds: Array.from({ length: 10 }, (_, i) => ({
      number: i + 18,
      unit: "UTI",
    })),
  },
  {
    name: "UTIM",
    beds: [{ number: 1, patientRut: "12345678-9", unit: "UTIM" }],
  },
  {
    name: "MEDICINA",
    beds: [{ number: 2, patientRut: "98765432-1", unit: "MEDICINA" }],
  },
  { name: "CIRUGIA", beds: [] },
  { name: "URGENCIAS", beds: [] },
  { name: "GINECOLOGIA", beds: [] },
  { name: "PENCIONADOS", beds: [] },
  { name: "HD", beds: [] },
];
//
// Mock fetch function for /units endpoint
const fetchUnits = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  return units;
};

// Custom hook using TanStack Query
export function useMockUnitsQuery() {
  return useQuery({
    queryKey: ["units"],
    queryFn: fetchUnits,
  });
}
