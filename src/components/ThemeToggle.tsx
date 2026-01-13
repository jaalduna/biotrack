import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-4 w-4" />;
    }
    return resolvedTheme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );
  };

  const getLabel = () => {
    if (theme === "system") return "System";
    return theme === "dark" ? "Dark" : "Light";
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className={cn(
        "w-full",
        collapsed ? "justify-center px-2" : "justify-start gap-2"
      )}
      title={collapsed ? `Theme: ${getLabel()}` : undefined}
    >
      {getIcon()}
      {!collapsed && <span>{getLabel()}</span>}
    </Button>
  );
}
