import { createContext, use, useState, type ReactNode } from "react";
import { type Unit } from "@/models/Units";

interface PatientFilterState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedUnit: Unit | "all";
  setSelectedUnit: (unit: Unit | "all") => void;
  selectedBed: string;
  setSelectedBed: (bed: string) => void;
  showOnlyAlerts: boolean;
  setShowOnlyAlerts: (show: boolean) => void;
}

const PatientFilterContext = createContext<PatientFilterState | undefined>(
  undefined,
);

export const PatientFilterProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<Unit | "all">("all");
  const [selectedBed, setSelectedBed] = useState<string>("all");
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  return (
    <PatientFilterContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        selectedUnit,
        setSelectedUnit,
        selectedBed,
        setSelectedBed,
        showOnlyAlerts,
        setShowOnlyAlerts,
      }}
    >
      {children}
    </PatientFilterContext.Provider>
  );
};

export const usePatientFilter = () => {
  const context = use(PatientFilterContext);
  if (!context) {
    throw new Error(
      "usePatientFilter must be used within a PatientFilterProvider",
    );
  }
  return context;
};
