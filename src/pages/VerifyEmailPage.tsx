import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setError("Invalid verification link");
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/v1/auth/verify-email/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Verification failed");
        }

        await response.json();
        setStatus("success");

        // If user is logged in, refresh their data by re-logging them in
        // This updates the email_verified field in the context
        if (user) {
          // Force refresh user data from localStorage
          const storedUser = localStorage.getItem("biotrack_user");
          if (storedUser) {
            const updatedUser = JSON.parse(storedUser);
            updatedUser.email_verified = true;
            localStorage.setItem("biotrack_user", JSON.stringify(updatedUser));
          }
          // Reload the page to refresh user context
          setTimeout(() => {
            // If user doesn't have a team, redirect to team setup instead
            if (!user.team_id) {
              window.location.href = "/biotrack/team/setup";
            } else {
              window.location.href = "/biotrack/patients";
            }
          }, 2000);
        } else {
          // Redirect to login if not logged in
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }

      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    };

    verifyEmail();
  }, [token, navigate, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "loading" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {status === "success" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          )}

          {status === "error" && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          )}

          <CardTitle>
            {status === "loading" && "Verifying Your Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          {status === "loading" && (
            <p className="text-muted-foreground">
              Please wait while we verify your email address...
            </p>
          )}

          {status === "success" && (
            <>
              <p className="text-muted-foreground">
                Your email has been successfully verified. You can now access all features.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard in a few seconds...
              </p>
              <Button onClick={() => navigate("/patients")} className="w-full">
                Go to Dashboard
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-muted-foreground">
                {error || "We couldn't verify your email address."}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/verify-email-sent")}
                  variant="outline"
                  className="w-full"
                >
                  Request New Verification Email
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}