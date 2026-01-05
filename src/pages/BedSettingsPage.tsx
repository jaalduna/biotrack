import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import type { Unit } from "@/models/Units";
import type { BedConfiguration } from "@/models/Beds";
import { bedConfigApi } from "@/services/Api";

export const BedSettingsPage = () => {
  const [unitConfigurations, setUnitConfigurations] = useState<BedConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BedConfiguration | null>(null);
  const [newUnit, setNewUnit] = useState<Unit>("UCI");
  const [newBedCount, setNewBedCount] = useState(17);
  const [newStartNumber, setNewStartNumber] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      const configs = await bedConfigApi.getAll();
      setUnitConfigurations(configs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      if (editingUnit) {
        await bedConfigApi.update(editingUnit.id, {
          unit: newUnit,
          bedCount: newBedCount,
          startNumber: newStartNumber,
          endNumber: newStartNumber + newBedCount - 1
        });
        setUnitConfigurations(prev => 
          prev.map(config => 
            config.id === editingUnit.id 
              ? { ...config, unit: newUnit, bedCount: newBedCount, startNumber: newStartNumber, endNumber: newStartNumber + newBedCount - 1 }
              : config
          )
        );
        setEditingUnit(null);
      } else {
        const newConfig: BedConfiguration = {
          id: Date.now().toString(),
          unit: newUnit,
          bedCount: newBedCount,
          startNumber: newStartNumber,
          endNumber: newStartNumber + newBedCount - 1
        };
        await bedConfigApi.create(newConfig);
        setUnitConfigurations(prev => [...prev, newConfig]);
      }
      
      setIsAddUnitOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewUnit("UCI");
    setNewBedCount(17);
    setNewStartNumber(1);
  };

  const handleEditUnit = (config: BedConfiguration) => {
    setEditingUnit(config);
    setNewUnit(config.unit);
    setNewBedCount(config.bedCount);
    setNewStartNumber(config.startNumber);
    setIsAddUnitOpen(true);
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit configuration?')) return;
    
    try {
      await bedConfigApi.delete(id);
      setUnitConfigurations(prev => prev.filter(config => config.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg text-destructive">Error: {error}</div>
          <Button onClick={loadConfigurations} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bed Settings</h1>
        <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={isSubmitting}>
              <Plus className="h-4 w-4" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingUnit ? "Edit Unit" : "Add New Unit"}</DialogTitle>
              <DialogDescription>
                Configure a new unit with bed numbering.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit Name</Label>
                <Select value={newUnit} onValueChange={(value) => setNewUnit(value as Unit)}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UCI">UCI</SelectItem>
                    <SelectItem value="UTI">UTI</SelectItem>
                    <SelectItem value="UTIM">UTIM</SelectItem>
                    <SelectItem value="MEDICINA">MEDICINA</SelectItem>
                    <SelectItem value="CIRUGIA">CIRUGIA</SelectItem>
                    <SelectItem value="URGENCIAS">URGENCIAS</SelectItem>
                    <SelectItem value="GINECOLOGIA">GINECOLOGIA</SelectItem>
                    <SelectItem value="PENCIONADOS">PENCIONADOS</SelectItem>
                    <SelectItem value="HD">HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bedCount">Number of Beds</Label>
                <Input
                  id="bedCount"
                  type="number"
                  value={newBedCount}
                  onChange={(e) => setNewBedCount(Number(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startNumber">Start Number</Label>
                <Input
                  id="startNumber"
                  type="number"
                  value={newStartNumber}
                  onChange={(e) => setNewStartNumber(Number(e.target.value))}
                  min="1"
                  max="999"
                />
              </div>
              <div className="grid gap-2">
                <Label>End Number</Label>
                <div className="p-2 border rounded-md bg-muted">
                  {newStartNumber + newBedCount - 1}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddUnitOpen(false);
                setEditingUnit(null);
                resetForm();
              }} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddUnit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingUnit ? 'Update' : 'Add') + ' Unit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {unitConfigurations.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{config.unit}</CardTitle>
                  <CardDescription>
                    Beds {config.startNumber} to {config.endNumber} ({config.bedCount} beds)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUnit(config)}
                    disabled={isSubmitting}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUnit(config.id)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="secondary">Unit: {config.unit}</Badge>
                <Badge variant="outline">Beds: {config.bedCount}</Badge>
                <Badge variant="outline">Range: {config.startNumber}-{config.endNumber}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};