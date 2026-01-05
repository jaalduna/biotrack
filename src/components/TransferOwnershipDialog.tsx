import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { teamsApi } from "@/services/Api";
import type { TeamMember } from "@/services/Api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, User } from "lucide-react";

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  members: TeamMember[];
  onOwnershipTransferred: () => void;
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  teamId,
  members,
  onOwnershipTransferred
}: TransferOwnershipDialogProps) {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [transferring, setTransferring] = useState(false);

  // Filter out current user and get eligible members (admins and members)
  const eligibleMembers = members.filter(
    member => member.id !== user?.id && member.team_role !== "owner"
  );

  const handleTransfer = async () => {
    if (!selectedUserId) return;

    setTransferring(true);
    try {
      await teamsApi.transferOwnership(teamId, selectedUserId);
      onOwnershipTransferred();
      onOpenChange(false);
      setSelectedUserId("");
    } catch (err) {
      // Error is handled by API error handler
      console.error("Failed to transfer ownership:", err);
    } finally {
      setTransferring(false);
    }
  };

  const selectedMember = members.find(m => m.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Transfer Team Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of this team to another member. You will become an admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select new owner</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team member" />
              </SelectTrigger>
              <SelectContent>
                {eligibleMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      {member.team_role === "admin" ? (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      {member.name} ({member.email})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMember && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>{selectedMember.name}</strong> will become the new team owner.
                You will become an admin with reduced permissions.
              </p>
            </div>
          )}

          {eligibleMembers.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                No eligible members to transfer ownership to. Add more team members first.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={transferring}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedUserId || transferring || eligibleMembers.length === 0}
          >
            {transferring ? "Transferring..." : "Transfer Ownership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}