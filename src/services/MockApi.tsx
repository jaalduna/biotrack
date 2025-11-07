export type PatientStatus = "waiting" | "active" | "archived";
export type Unit =
  | "UCI"
  | "UTI"
  | "UTIM"
  | "MEDICINA"
  | "CIRUGIA"
  | "URGENCIAS"
  | "GINECOLOGIA"
  | "PENCIONADOS"
  | "HD";

//export an array containing Unit values
export const unitsOptions: (Unit | "all")[] = [
  "all",
  "UCI",
  "UTI",
  "UTIM",
  "MEDICINA",
  "CIRUGIA",
  "URGENCIAS",
  "GINECOLOGIA",
  "PENCIONADOS",
  "HD",
];
export interface Patient {
  id: string;
  rut: string;
  name: string;
  status: PatientStatus;
  unit: Unit;
  bedNumber: number;
  hasEndingSoonProgram?: boolean;
}
export const mockPatients: Patient[] = [
  {
    id: "1",
    rut: "12.345.678-9",
    name: "María González Pérez",
    status: "active",
    unit: "UCI",
    bedNumber: 5,
    hasEndingSoonProgram: true,
  },
  {
    id: "2",
    rut: "23.456.789-0",
    name: "Juan Carlos Rodríguez",
    status: "waiting",
    unit: "UTI",
    bedNumber: 22,
  },
  {
    id: "3",
    rut: "34.567.890-1",
    name: "Ana Patricia Silva",
    status: "active",
    unit: "UCI",
    bedNumber: 12,
  },
  {
    id: "4",
    rut: "45.678.901-2",
    name: "Pedro Martínez López",
    status: "archived",
    unit: "UTI",
    bedNumber: 28,
  },
  {
    id: "5",
    rut: "56.789.012-3",
    name: "Carmen Fernández Torres",
    status: "active",
    unit: "UCI",
    bedNumber: 3,
  },
  {
    id: "6",
    rut: "67.890.123-4",
    name: "Roberto Sánchez Muñoz",
    status: "waiting",
    unit: "UTI",
    bedNumber: 19,
  },
  {
    id: "7",
    rut: "78.901.234-5",
    name: "Isabel Ramírez Castro",
    status: "active",
    unit: "UCI",
    bedNumber: 8,
    hasEndingSoonProgram: true,
  },
  {
    id: "8",
    rut: "89.012.345-6",
    name: "Diego Vargas Morales",
    status: "archived",
    unit: "UTI",
    bedNumber: 34,
  },
];

export const uciBeds = Array.from({ length: 17 }, (_, i) => i + 1);
export const utiBeds = Array.from({ length: 17 }, (_, i) => i + 18);
export const allBeds = [...uciBeds, ...utiBeds];
