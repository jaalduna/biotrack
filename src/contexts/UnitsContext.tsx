import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { unitsApi, type HospitalUnit } from "@/services/Api";
import { useAuth } from "./AuthContext";

interface UnitsContextType {
  units: HospitalUnit[];
  unitNames: string[];
  loading: boolean;
  error: string | null;
  refreshUnits: () => Promise<void>;
  getUnitByName: (name: string) => HospitalUnit | undefined;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [units, setUnits] = useState<HospitalUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await unitsApi.getAll();
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units:", err);
      setError(err instanceof Error ? err.message : "Failed to load units");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load units when user is authenticated
  useEffect(() => {
    if (user) {
      refreshUnits();
    }
  }, [user, refreshUnits]);

  const unitNames = units.map((u) => u.name);

  const getUnitByName = useCallback(
    (name: string) => units.find((u) => u.name === name),
    [units]
  );

  return (
    <UnitsContext.Provider
      value={{
        units,
        unitNames,
        loading,
        error,
        refreshUnits,
        getUnitByName,
      }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error("useUnits must be used within a UnitsProvider");
  }
  return context;
}
