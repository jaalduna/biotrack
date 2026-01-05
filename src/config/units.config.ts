/**
 * Units Configuration
 * Centralized configuration for all hospital units and their bed counts
 * Can be loaded from API in production or use local defaults
 */

export interface UnitConfig {
  id: string;
  name: string;
  bedCount: number;
  bedStartNumber: number;
  description?: string;
  isActive: boolean;
}

export const UNITS_CONFIG: UnitConfig[] = [
  {
    id: "UCI",
    name: "UCI",
    bedCount: 17,
    bedStartNumber: 1,
    description: "Unidad de Cuidados Intensivos",
    isActive: true,
  },
  {
    id: "UTI",
    name: "UTI",
    bedCount: 17,
    bedStartNumber: 18,
    description: "Unidad de Terapia Intensiva",
    isActive: true,
  },
  {
    id: "UTIM",
    name: "UTIM",
    bedCount: 24,
    bedStartNumber: 1,
    description: "Unidad de Terapia Intermedia",
    isActive: true,
  },
  {
    id: "MEDICINA",
    name: "MEDICINA",
    bedCount: 39,
    bedStartNumber: 1,
    description: "Medicina Interna",
    isActive: true,
  },
  {
    id: "CIRUGIA",
    name: "CIRUGIA",
    bedCount: 40,
    bedStartNumber: 1,
    description: "Cirugía",
    isActive: true,
  },
  {
    id: "URGENCIAS",
    name: "URGENCIAS",
    bedCount: 50,
    bedStartNumber: 1,
    description: "Urgencias",
    isActive: true,
  },
  {
    id: "GINECOLOGIA",
    name: "GINECOLOGIA",
    bedCount: 20,
    bedStartNumber: 1,
    description: "Ginecología",
    isActive: true,
  },
  {
    id: "PENSIONADOS",
    name: "PENSIONADOS",
    bedCount: 30,
    bedStartNumber: 1,
    description: "Pensionados",
    isActive: true,
  },
  {
    id: "HD",
    name: "HD",
    bedCount: 15,
    bedStartNumber: 1,
    description: "Hemodiálisis",
    isActive: true,
  },
];

/**
 * Get unit configuration by unit name
 */
export function getUnitConfig(unitName: string): UnitConfig | undefined {
  return UNITS_CONFIG.find(
    (unit) => unit.id === unitName || unit.name === unitName
  );
}

/**
 * Get all active units
 */
export function getActiveUnits(): UnitConfig[] {
  return UNITS_CONFIG.filter((unit) => unit.isActive);
}

/**
 * Get beds array for a specific unit
 */
export function getBedsByUnitName(unitName: string): number[] {
  const unitConfig = getUnitConfig(unitName);
  if (!unitConfig) {
    return [];
  }
  const startNum = unitConfig.bedStartNumber || 1;
  return Array.from(
    { length: unitConfig.bedCount },
    (_, i) => startNum + i
  );
}

/**
 * Get all beds from all active units
 */
export function getAllBeds(): number[] {
  const allBeds: number[] = [];
  getActiveUnits().forEach((unit) => {
    const unitBeds = getBedsByUnitName(unit.name);
    allBeds.push(...unitBeds);
  });
  return allBeds;
}

/**
 * Load unit configurations from API
 * This function can be called during app initialization to sync with backend
 */
export async function loadUnitsFromApi(): Promise<UnitConfig[]> {
  try {
    const response = await fetch("http://localhost:8000/api/v1/unit-configs/active");
    if (!response.ok) {
      console.warn("Failed to load units from API, using defaults");
      return getActiveUnits();
    }
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      bedCount: item.bed_count,
      description: item.description,
      isActive: item.is_active,
    }));
  } catch (error) {
    console.warn("Error loading units from API:", error);
    return getActiveUnits();
  }
}
