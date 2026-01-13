import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Pill,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Patients",
    href: "/patients",
    icon: Users,
  },
  {
    name: "Bed Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Team Settings",
    href: "/team/settings",
    icon: UserCog,
    adminOnly: true,
  },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { team } = useTeam();
  const { collapsed, toggle } = useSidebar();

  const isActiveRoute = (href: string) => {
    if (href === "/patients") {
      return location.pathname === "/patients" || location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly) {
      return user?.team_role === "owner" || user?.team_role === "admin";
    }
    return true;
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link to="/patients" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Pill className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">BioTrack</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/patients" className="mx-auto">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Pill className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        )}
      </div>

      {/* Team info (when expanded) */}
      {!collapsed && team && (
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
          <p className="text-xs text-muted-foreground">
            {team.subscription_plan || "Free"} Plan
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle and collapse */}
      <div className="p-2 border-t border-border space-y-1">
        <ThemeToggle collapsed={collapsed} />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={cn("w-full", collapsed ? "px-2" : "justify-start")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
