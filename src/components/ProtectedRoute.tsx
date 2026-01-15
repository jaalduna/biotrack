import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdvanced?: boolean;
}

export function ProtectedRoute({ children, requireAdvanced = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdvanced, isBetaMode } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve the intended destination for redirect after login
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    const loginPath = isBetaMode ? "/beta" : `/login?redirect=${redirectPath}`;
    return <Navigate to={loginPath} replace />;
  }

  if (requireAdvanced && !isAdvanced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            This page requires advanced user privileges.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
