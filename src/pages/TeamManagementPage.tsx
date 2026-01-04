import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import { teamsApi, invitationsApi, subscriptionsApi } from "@/services/Api";
import { UserHeader } from "@/components/UserHeader";
import { LeaveTeamDialog } from "@/components/LeaveTeamDialog";
import { TransferOwnershipDialog } from "@/components/TransferOwnershipDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Crown, Shield, User as UserIcon, Plus, ExternalLink, LogOut, ArrowLeft } from "lucide-react";

export function TeamManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { team, members, invitations, isOwner, isAdmin, refreshMembers, refreshInvitations } = useTeam();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  if (!team || !user) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <div className="container max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">You must be part of a team to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <div className="container max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Only team admins and owners can access team settings.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await invitationsApi.send(team.id, inviteEmail, inviteRole);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("member");
      await refreshInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      await invitationsApi.cancel(team.id, invitationId);
      await refreshInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invitation");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

    try {
      await teamsApi.removeMember(team.id, memberId);
      await refreshMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: "admin" | "member") => {
    try {
      await teamsApi.updateMemberRole(team.id, memberId, newRole);
      await refreshMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { url } = await subscriptionsApi.createPortal();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open subscription portal");
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return <Crown className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => navigate("/patients")}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  title="Back to Patients"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-3xl font-bold">Team Settings</h1>
              </div>
              <p className="text-muted-foreground">Manage your team members and subscription</p>
            </div>
          </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-800 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>Basic details about your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Team Name</Label>
              <p className="text-lg font-semibold">{team.name}</p>
            </div>
            <div>
              <Label>Subscription Plan</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={
                  team.subscription_status === "active" ? "bg-green-100 text-green-800" :
                  team.subscription_status === "trial" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"
                }>
                  {team.subscription_status === "trial" ? "Free Trial" : team.subscription_plan || "Free"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({members.length}/{team.member_limit} members)
                </span>
              </div>
            </div>
            {isOwner && (
              <Button onClick={handleManageSubscription} disabled={loading} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Manage Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Transfer Ownership - Only for owners */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Transfer Ownership
              </CardTitle>
              <CardDescription>
                Transfer team ownership to another member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Transfer ownership to allow you to leave the team or delegate responsibilities.
                </p>
                <Button
                  onClick={() => setShowTransferDialog(true)}
                  className="gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Transfer Ownership
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Team - Only for non-owners */}
        {user.team_role !== "owner" && (
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="h-5 w-5" />
                Leave Team
              </CardTitle>
              <CardDescription>
                Remove yourself from this team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You'll lose access to all team data. You'll need to be invited again to rejoin.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowLeaveDialog(true)}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Leave Team
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({members.length})</CardTitle>
            <CardDescription>People who have access to this team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(member.team_role)}
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && member.team_role !== "owner" && (
                      <select
                        value={member.team_role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as "admin" | "member")}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {!isOwner && (
                      <Badge variant="outline">{member.team_role}</Badge>
                    )}
                    {isOwner && member.team_role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invite Members */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Members</CardTitle>
            <CardDescription>Send invitations to join your team</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={loading || members.length >= team.member_limit} className="gap-2">
                <Plus className="h-4 w-4" />
                Send Invitation
              </Button>
              {members.length >= team.member_limit && (
                <p className="text-sm text-destructive">
                  You've reached your member limit. Upgrade your plan to add more members.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
              <CardDescription>Invitations waiting to be accepted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.filter(inv => inv.status === "pending").map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited as {invitation.role} • Expires {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Team Dialog */}
        <LeaveTeamDialog
          open={showLeaveDialog}
          onOpenChange={setShowLeaveDialog}
        />

        {/* Transfer Ownership Dialog */}
        <TransferOwnershipDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          teamId={team.id}
          members={members}
          onOwnershipTransferred={() => {
            refreshMembers(); // Refresh to show new roles
            setSuccess("Ownership transferred successfully");
          }}
        />
      </div>
    </div>
  );
}
