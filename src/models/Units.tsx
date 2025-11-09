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
