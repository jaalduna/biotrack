import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertCircle, X, Mail } from "lucide-react";

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail, isBetaMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (isBetaMode || !user || user.email_verified || dismissed) {
    return null;
  }

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
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-800">
              <strong>Please verify your email address</strong> to access all features.
            </p>
            {message ? (
              <p className="text-xs text-green-700 mt-1">{message}</p>
            ) : (
              <p className="text-xs text-yellow-700 mt-1">
                Check your inbox for the verification link.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleResendEmail}
            disabled={resending}
            size="sm"
            variant="outline"
            className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
          >
            <Mail className="h-4 w-4 mr-2" />
            {resending ? "Sending..." : "Resend Email"}
          </Button>

          <Button
            onClick={() => setDismissed(true)}
            size="sm"
            variant="ghost"
            className="text-yellow-800 hover:bg-yellow-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}