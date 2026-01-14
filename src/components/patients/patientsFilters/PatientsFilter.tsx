//how to make the data updates by event and not by pulling, should I enable a web socket or a pub/sub broker?
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

import { usePatientFilter } from "../context/PatientFilterContext";
import { useUnits } from "@/contexts/UnitsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allBeds } from "@/services/MockApi";

export const PatientsFilter = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedUnit,
    setSelectedUnit,
    selectedBed,
    setSelectedBed,
    showOnlyAlerts,
    setShowOnlyAlerts,
  } = usePatientFilter();

  const { unitNames } = useUnits();
  const unitsOptions = useMemo(() => ["all", ...unitNames], [unitNames]);

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, setSearchQuery]);

  // Sync when external searchQuery changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedUnit !== "all" ||
    selectedBed !== "all" ||
    showOnlyAlerts;

  const clearFilters = () => {
    setLocalSearchQuery("");
    setSearchQuery("");
    setSelectedUnit("all");
    setSelectedBed("all");
    setShowOnlyAlerts(false);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name or RUT..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Unit:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {unitsOptions.map((unit) => (
            <Badge
              key={unit}
              variant={selectedUnit === unit ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedUnit(unit)}
            >
              {unit === "all" ? "All" : unit}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Bed:
          </span>
          <Select value={selectedBed} onValueChange={setSelectedBed}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All beds" />
            </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All beds</SelectItem>
               {allBeds.map((bed: number, index: number) => (
                 <SelectItem key={`bed-${index}-${bed}`} value={bed.toString()}>
                   Bed {bed}
                 </SelectItem>
               ))}
             </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Alerts:
          </span>
          <Badge
            variant={showOnlyAlerts ? "destructive" : "outline"}
            className="cursor-pointer bg-orange-500"
            onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
          >
            1 Day Left
          </Badge>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};
