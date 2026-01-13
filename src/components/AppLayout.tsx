import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { UserHeader } from "./UserHeader";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { CommandPalette } from "./CommandPalette";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Command Palette - Cmd/Ctrl + K */}
      <CommandPalette />

      {/* Sidebar - fixed position */}
      <Sidebar />

      {/* Main content area - offset by sidebar width */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Email verification banner (if needed) */}
        <EmailVerificationBanner />

        {/* Top header with user info */}
        <UserHeader />

        {/* Page content */}
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
