import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { teamsApi } from "@/services/Api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export function TeamSetupPage() {
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if user came from Stripe checkout
  const sessionId = searchParams.get("session_id");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (teamName.trim().length < 3) {
      setError("Team name must be at least 3 characters long");
      return;
    }

    setLoading(true);

    try {
      // Create the team - the backend should associate it with the user's stripe session
      await teamsApi.create(teamName.trim());
      
      // Force logout and login to get fresh JWT with team_id
      logout();
      navigate("/login?message=team-created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  // If user already has a team, redirect to patients
  if (user.team_id) {
    navigate("/patients");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Set Up Your Team
          </CardTitle>
          <CardDescription>
            {sessionId 
              ? "Payment successful! Now let's set up your team."
              : "Create your team to get started with BioTrack."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                type="text"
                placeholder="e.g., City Hospital ICU"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                disabled={loading}
                minLength={3}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                This will be displayed to all team members
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || teamName.trim().length < 3}
            >
              {loading ? "Creating Team..." : "Create Team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
