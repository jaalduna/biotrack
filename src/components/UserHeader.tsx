import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router";

export function UserHeader() {
  const { user, logout } = useAuth();
  const { team } = useTeam();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getSubscriptionStatusBadge = () => {
    if (!team) return null;

    const statusColors = {
      trial: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      cancelled: "bg-yellow-100 text-yellow-800",
      expired: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={statusColors[team.subscription_status] || "bg-gray-100 text-gray-800"}>
        {team.subscription_status === "trial" ? "Trial" : team.subscription_plan || "Free"}
      </Badge>
    );
  };

  const getRoleBadge = () => {
    if (!user.team_role) return null;

    const roleColors = {
      owner: "bg-purple-100 text-purple-800",
      admin: "bg-indigo-100 text-indigo-800",
      member: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge variant="outline" className={roleColors[user.team_role]}>
        {user.team_role}
      </Badge>
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Team info */}
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {team?.name || "BioTrack"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getSubscriptionStatusBadge()}
                {team && (
                  <span className="text-xs text-gray-500">
                    {team.member_limit} members max
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side - User info & actions */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500 flex items-center justify-end gap-2">
                <span>{user.email}</span>
                {getRoleBadge()}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {user.team_role === "owner" || user.team_role === "admin" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/team/settings")}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Team Settings
                </Button>
              ) : null}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
