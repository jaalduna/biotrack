import { useQuery } from "@tanstack/react-query";
import type { Unit } from "@/models/Units";

export const units: Unit[] = [
  {
    name: "UCI",
    beds: Array.from({ length: 7 }, (_, i) => ({ number: i + 1 })),
  },
  {
    name: "UTI",
    beds: Array.from({ length: 10 }, (_, i) => ({ number: i + 18 })),
  },
  { name: "UTIM", beds: [] },
  { name: "MEDICINA", beds: [] },
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
  await new Promise((resolve) => setTimeout(resolve, 300));
  return units;
};

// Custom hook using TanStack Query
export function useMockUnitsQuery() {
  return useQuery({
    queryKey: ["units"],
    queryFn: fetchUnits,
  });
}
