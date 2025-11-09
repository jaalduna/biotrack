import type { Patient } from "@/models/Patients";

export const mockPatients: Patient[] = [
  {
    id: "1",
    rut: "12.345.678-9",
    name: "María González Pérez",
    status: "active",
    unit: "UCI",
    bedNumber: 5,
    hasEndingSoonProgram: true,
    age: 25,
  },
  {
    id: "2",
    rut: "23.456.789-0",
    name: "Juan Carlos Rodríguez",
    status: "waiting",
    unit: "UTI",
    bedNumber: 22,
    age: 30,
  },
  {
    id: "3",
    rut: "34.567.890-1",
    name: "Ana Patricia Silva",
    status: "active",
    unit: "UCI",
    bedNumber: 12,
    age: 50,
  },
  {
    id: "4",
    rut: "45.678.901-2",
    name: "Pedro Martínez López",
    status: "archived",
    unit: "UTI",
    bedNumber: 28,
    age: 55,
  },
  {
    id: "5",
    rut: "56.789.012-3",
    name: "Carmen Fernández Torres",
    status: "active",
    unit: "UCI",
    bedNumber: 3,
    age: 26,
  },
  {
    id: "6",
    rut: "67.890.123-4",
    name: "Roberto Sánchez Muñoz",
    status: "waiting",
    unit: "UTI",
    bedNumber: 19,
    age: 80,
  },
  {
    id: "7",
    rut: "78.901.234-5",
    name: "Isabel Ramírez Castro",
    status: "active",
    unit: "UCI",
    bedNumber: 8,
    hasEndingSoonProgram: true,
    age: 56,
  },
  {
    id: "8",
    rut: "89.012.345-6",
    name: "Diego Vargas Morales",
    status: "archived",
    unit: "UTI",
    bedNumber: 34,
    age: 70,
  },
];

export const uciBeds = Array.from({ length: 17 }, (_, i) => i + 1);
export const utiBeds = Array.from({ length: 17 }, (_, i) => i + 18);
export const allBeds = [...uciBeds, ...utiBeds];
