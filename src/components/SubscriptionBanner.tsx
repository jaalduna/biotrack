import { useTeam } from "@/contexts/TeamContext";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SubscriptionBanner() {
  const { team } = useTeam();
  const navigate = useNavigate();
  const { isBetaMode } = useAuth();

  if (isBetaMode || !team) return null;

  const now = new Date();
  const trialEndsAt = team.trial_ends_at ? new Date(team.trial_ends_at) : null;
  const daysRemaining = trialEndsAt 
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Show banner for trial ending soon (7 days or less)
  if (team.subscription_status === "trial" && trialEndsAt && daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Trial ending soon
                </p>
                <p className="text-xs text-yellow-700">
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining. Subscribe to continue using BioTrack.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/subscription/checkout")}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Subscribe Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show banner for expired trial
  if (team.subscription_status === "trial" && trialEndsAt && daysRemaining <= 0) {
    return (
      <div className="bg-red-50 border-b border-red-200">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Trial expired
                </p>
                <p className="text-xs text-red-700">
                  Your trial has ended. Subscribe now to regain access to your data.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/subscription/checkout")}
              className="bg-red-600 hover:bg-red-700"
            >
              Subscribe Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show banner for cancelled subscription
  if (team.subscription_status === "cancelled" && team.stripe_subscription_id) {
    return (
      <div className="bg-orange-50 border-b border-orange-200">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Subscription cancelled
                </p>
                <p className="text-xs text-orange-700">
                  Your subscription has been cancelled. Access will end at the end of your billing period.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/subscription/checkout")}
              className="border-orange-600 text-orange-600 hover:bg-orange-100"
            >
              Reactivate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show banner for expired subscription
  if (team.subscription_status === "expired") {
    return (
      <div className="bg-red-50 border-b border-red-200">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Subscription expired
                </p>
                <p className="text-xs text-red-700">
                  Your subscription has expired. Subscribe now to regain access.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/subscription/checkout")}
              className="bg-red-600 hover:bg-red-700"
            >
              Subscribe Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
