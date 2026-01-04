import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { teamsApi } from "@/services/Api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LeaveTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveTeamDialog({ open, onOpenChange }: LeaveTeamDialogProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleLeaveTeam = async () => {
    setLeaving(true);
    try {
      await teamsApi.leave();

      // Force logout to clear team context
      logout();

      // Redirect to home
      navigate("/");

    } catch (err) {
      // Error is handled by API error handler
      console.error("Failed to leave team:", err);
    } finally {
      setLeaving(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Team?</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave your current team?
            You'll lose access to all team data and will need to be invited again to rejoin.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={leaving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLeaveTeam}
            disabled={leaving}
            variant="destructive"
          >
            {leaving ? "Leaving..." : "Leave Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}