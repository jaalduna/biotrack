import { Link, useLocation } from "react-router";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route configuration for automatic breadcrumb generation
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  settings: "Settings",
  team: "Team",
  "bed-configuration": "Bed Configuration",
};

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const location = useLocation();

  // Auto-generate breadcrumbs from URL if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(location.pathname);

  // Don't render if only one item (current page)
  if (breadcrumbItems.length <= 1 && !showHome) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {showHome && (
          <>
            <li>
              <Link
                to="/"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>
            {breadcrumbItems.length > 0 && (
              <li>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </li>
            )}
          </>
        )}
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {isLast || !item.href ? (
                <span
                  className={cn(
                    "font-medium",
                    isLast ? "text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Remove /biotrack prefix if present
  const cleanPath = pathname.replace(/^\/biotrack/, "").replace(/^\//, "");

  if (!cleanPath || cleanPath === "") {
    return [];
  }

  const segments = cleanPath.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];
  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Check if this segment is a known route
    const label = routeLabels[segment.toLowerCase()];

    if (label) {
      items.push({
        label,
        href: i < segments.length - 1 ? currentPath : undefined,
      });
    } else if (segment) {
      // For dynamic segments (like patient RUTs), try to make them readable
      // If it looks like a RUT (e.g., 12.345.678-9), keep it
      // Otherwise capitalize and replace dashes with spaces
      const isRut = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(segment);
      const displayLabel = isRut
        ? segment
        : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

      items.push({
        label: displayLabel,
        href: i < segments.length - 1 ? currentPath : undefined,
      });
    }
  }

  return items;
}

// Custom hook for programmatic breadcrumb management
export function useBreadcrumb() {
  const location = useLocation();

  return {
    items: generateBreadcrumbs(location.pathname),
    currentPath: location.pathname,
  };
}
