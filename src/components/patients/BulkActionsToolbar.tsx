import { useState } from "react";
import { X, Archive, UserCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportPatientsListToCSV } from "@/utils/export";
import type { Patient, PatientStatus } from "@/models/Patients";

interface BulkActionsToolbarProps {
  selectedPatients: Patient[];
  onClearSelection: () => void;
  onStatusChange: (patientIds: string[], status: PatientStatus) => Promise<void>;
}

export function BulkActionsToolbar({
  selectedPatients,
  onClearSelection,
  onStatusChange,
}: BulkActionsToolbarProps) {
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "archive" | "activate" | null;
    title: string;
    description: string;
  }>({ type: null, title: "", description: "" });

  const count = selectedPatients.length;

  if (count === 0) return null;

  const handleStatusChange = async (status: PatientStatus) => {
    try {
      setLoading(true);
      await onStatusChange(
        selectedPatients.map((p) => p.id),
        status
      );
      onClearSelection();
    } catch (error) {
      console.error("Error updating patients:", error);
    } finally {
      setLoading(false);
      setConfirmAction({ type: null, title: "", description: "" });
    }
  };

  const handleExport = () => {
    exportPatientsListToCSV(selectedPatients);
  };

  return (
    <>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg">
          <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
            {count} selected
          </Badge>

          <div className="h-4 w-px bg-primary-foreground/30" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                disabled={loading}
              >
                <UserCheck className="h-4 w-4 mr-1.5" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() =>
                  setConfirmAction({
                    type: "activate",
                    title: "Activate Patients",
                    description: `Are you sure you want to activate ${count} patient${count > 1 ? "s" : ""}? This will mark them as active.`,
                  })
                }
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Set to Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setConfirmAction({
                    type: "archive",
                    title: "Archive Patients",
                    description: `Are you sure you want to archive ${count} patient${count > 1 ? "s" : ""}? They will be moved to archived status.`,
                  })
                }
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>

          <div className="h-4 w-px bg-primary-foreground/30" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear selection</span>
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmAction.type !== null}
        onOpenChange={() => setConfirmAction({ type: null, title: "", description: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleStatusChange(confirmAction.type === "archive" ? "archived" : "active")
              }
            >
              {loading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
