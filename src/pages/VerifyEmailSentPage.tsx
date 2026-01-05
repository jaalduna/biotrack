import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export function VerifyEmailSentPage() {
  const navigate = useNavigate();
  const { resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResendEmail = async () => {
    setResending(true);
    setMessage(null);
    try {
      await resendVerificationEmail();
      setMessage("Verification email sent! Check your inbox.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            We've sent a verification email to your inbox.
            Click the link in the email to verify your account.
          </p>

          {message && (
            <p className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? "Sending..." : "Resend Email"}
            </Button>

            <Button
              onClick={() => navigate("/patients")}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}