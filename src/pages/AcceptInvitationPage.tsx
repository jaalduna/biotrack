import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { invitationsApi, type TeamInvitation } from "@/services/Api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Mail, AlertCircle, LogIn, UserPlus } from "lucide-react";

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link");
        setLoading(false);
        return;
      }

      try {
        const invitationData = await invitationsApi.getByToken(token);
        setInvitation(invitationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      await invitationsApi.accept(token);
      
      // Redirect to patients page (user is now in team)
      navigate("/patients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };



  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <X className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check invitation status
  if (invitation && invitation.status !== "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitation Already {invitation.status}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This invitation has already been {invitation.status}.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if expired
  const isExpired = invitation && new Date(invitation.expires_at) < new Date();
  if (isExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <X className="h-5 w-5" />
              Invitation Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This invitation expired on {invitation && new Date(invitation.expires_at).toLocaleDateString()}.
              Please contact the team administrator for a new invitation.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ SCENARIO 1: NOT LOGGED IN ============
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>Join a team on BioTrack</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Show invitation details */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Invited as</p>
                <p className="font-medium capitalize">{invitation?.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invitation sent to</p>
                <p className="font-medium">{invitation?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="font-medium">
                  {invitation && new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                To accept this invitation, you need to create an account or login 
                with <strong>{invitation?.email}</strong>
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate(
                  `/register?email=${invitation?.email}&token=${token}&redirect=/invitations/accept/${token}`
                )}
                className="w-full gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Create Account & Accept
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate(
                  `/login?email=${invitation?.email}&redirect=/invitations/accept/${token}`
                )}
                className="w-full gap-2"
              >
                <LogIn className="h-4 w-4" />
                Already have an account? Login
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ SCENARIO 2: LOGGED IN, WRONG EMAIL ============
  if (user && user.email !== invitation?.email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Email Mismatch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-900">
                  <strong>This invitation was sent to:</strong><br />
                  {invitation?.email}
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>You're currently logged in as:</strong><br />
                  {user.email}
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                To accept this invitation, you need to login with the email address 
                that received the invitation.
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  logout();
                  navigate(
                    `/login?email=${invitation?.email}&redirect=/invitations/accept/${token}`
                  );
                }}
                className="w-full gap-2"
              >
                <LogIn className="h-4 w-4" />
                Switch to {invitation?.email}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/patients")}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ SCENARIO 4: ALREADY IN A TEAM ============
  if (user && user.team_id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Already in a Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              You already belong to a team.
            </p>
            <p className="text-sm text-muted-foreground">
              You must leave your current team before joining a new one.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/team/settings")}
                className="w-full"
              >
                Go to Team Settings
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/patients")}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ SCENARIO 3: LOGGED IN, CORRECT EMAIL, NO TEAM ============
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Team Invitation
          </CardTitle>
          <CardDescription>You've been invited to join a team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{invitation?.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your email</p>
              <p className="font-medium">{invitation?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="font-medium">{invitation && new Date(invitation.expires_at).toLocaleDateString()}</p>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 gap-2"
            >
              <Check className="h-4 w-4" />
              {accepting ? "Accepting..." : "Accept Invitation"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/patients")}
              disabled={accepting}
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
