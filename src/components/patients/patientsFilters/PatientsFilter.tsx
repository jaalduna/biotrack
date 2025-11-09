//how to make the data updates by event and not by pulling, should I enable a web socket or a pub/sub broker?
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { Label } from "@radix-ui/react-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";
import { Search, Plus, X } from "lucide-react";
import { useState } from "react";

import { allBeds, uciBeds, utiBeds } from "@/services/MockApi";
import { usePatientFilter } from "../context/PatientFilterContext";
import { unitsOptions, type Unit } from "@/models/Units";

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

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [newPatientRut, setNewPatientRut] = useState("");
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientUnit, setNewPatientUnit] = useState<Unit>("UCI");
  const [newPatientBed, setNewPatientBed] = useState("");

  const getAvailableBeds = () => {
    if (newPatientUnit === "UCI") return uciBeds;
    return utiBeds;
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedUnit !== "all" ||
    selectedBed !== "all" ||
    showOnlyAlerts;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedUnit("all");
    setSelectedBed("all");
    setShowOnlyAlerts(false);
  };

  //TODO: create on its own component
  const handleAddPatient = () => {
    console.log("[v0] Add patient:", {
      rut: newPatientRut,
      name: newPatientName,
      unit: newPatientUnit,
      bed: newPatientBed,
    });
    setIsAddPatientOpen(false);
    setNewPatientRut("");
    setNewPatientName("");
    setNewPatientUnit("UCI");
    setNewPatientBed("");
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or RUT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {/*//TODO: fix dialog format*/}

        <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter the patient information to add them to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  placeholder="e.g., 12.345.678-9"
                  value={newPatientRut}
                  onChange={(e) => setNewPatientRut(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Complete Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., María González Pérez"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={newPatientUnit}
                  onValueChange={(value) => setNewPatientUnit(value as Unit)}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UCI">UCI (Beds 1-17)</SelectItem>
                    <SelectItem value="UTI">UTI (Beds 18-34)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bed">Bed Number</Label>
                <Select value={newPatientBed} onValueChange={setNewPatientBed}>
                  <SelectTrigger id="bed">
                    <SelectValue placeholder="Select bed" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableBeds().map((bed) => (
                      <SelectItem key={bed} value={bed.toString()}>
                        Bed {bed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddPatientOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddPatient}>Add Patient</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Unit:
          </span>
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
              {allBeds.map((bed: number) => (
                <SelectItem key={bed} value={bed.toString()}>
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
