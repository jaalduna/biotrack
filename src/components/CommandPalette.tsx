import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  UserCog,
  Plus,
  Search,
  Moon,
  Sun,
  Monitor,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { patientsApi } from "@/services/Api";
import { useTheme } from "@/contexts/ThemeContext";
import type { Patient } from "@/models/Patients";

interface CommandPaletteProps {
  onCreatePatient?: () => void;
  onShowShortcuts?: () => void;
}

export function CommandPalette({
  onCreatePatient,
  onShowShortcuts,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Open command palette with Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search patients when search query changes
  useEffect(() => {
    if (!open) return;

    const searchPatients = async () => {
      if (search.length < 1) {
        setPatients([]);
        return;
      }

      setLoading(true);
      try {
        const allPatients = await patientsApi.getAll();
        const query = search.toLowerCase();
        const filtered = allPatients.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.rut.toLowerCase().includes(query)
        );
        setPatients(filtered.slice(0, 5)); // Limit to 5 results
      } catch (error) {
        console.error("Error searching patients:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchPatients, 200);
    return () => clearTimeout(debounce);
  }, [search, open]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    setSearch("");
    command();
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      runCommand(() => navigate(path));
    },
    [navigate, runCommand]
  );

  const handlePatientSelect = useCallback(
    (patient: Patient) => {
      runCommand(() => navigate(`/patients/${patient.rut}`));
    },
    [navigate, runCommand]
  );

  const handleThemeChange = useCallback(
    (newTheme: "light" | "dark" | "system") => {
      runCommand(() => setTheme(newTheme));
    },
    [setTheme, runCommand]
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className={cn(
        "fixed inset-0 z-50",
        "bg-black/50 backdrop-blur-sm",
        "flex items-start justify-center pt-[20vh]"
      )}
    >
      <div
        className={cn(
          "w-full max-w-lg mx-4",
          "bg-popover text-popover-foreground",
          "rounded-xl border border-border shadow-2xl",
          "overflow-hidden"
        )}
      >
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search patients, navigate, or run commands..."
            className={cn(
              "flex h-12 w-full bg-transparent py-3 px-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "outline-none disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            {loading ? "Searching..." : "No results found."}
          </Command.Empty>

          {/* Patient Results */}
          {patients.length > 0 && (
            <Command.Group
              heading="Patients"
              className="text-xs font-medium text-muted-foreground px-2 py-1.5"
            >
              {patients.map((patient) => (
                <Command.Item
                  key={patient.id}
                  value={`patient-${patient.rut}-${patient.name}`}
                  onSelect={() => handlePatientSelect(patient)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                    "text-sm text-foreground",
                    "aria-selected:bg-accent aria-selected:text-accent-foreground"
                  )}
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {patient.rut} • {patient.unit} Bed {patient.bedNumber}
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Quick Actions */}
          <Command.Group
            heading="Actions"
            className="text-xs font-medium text-muted-foreground px-2 py-1.5"
          >
            {onCreatePatient && (
              <Command.Item
                value="new-patient-create-add"
                onSelect={() => runCommand(onCreatePatient)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                  "text-sm text-foreground",
                  "aria-selected:bg-accent aria-selected:text-accent-foreground"
                )}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>New Patient</span>
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                  N
                </kbd>
              </Command.Item>
            )}
            {onShowShortcuts && (
              <Command.Item
                value="keyboard-shortcuts-help"
                onSelect={() => runCommand(onShowShortcuts)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                  "text-sm text-foreground",
                  "aria-selected:bg-accent aria-selected:text-accent-foreground"
                )}
              >
                <Keyboard className="h-4 w-4 text-muted-foreground" />
                <span>Keyboard Shortcuts</span>
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                  ?
                </kbd>
              </Command.Item>
            )}
          </Command.Group>

          {/* Navigation */}
          <Command.Group
            heading="Navigation"
            className="text-xs font-medium text-muted-foreground px-2 py-1.5"
          >
            <Command.Item
              value="go-to-dashboard-home"
              onSelect={() => handleNavigate("/dashboard")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                "text-sm text-foreground",
                "aria-selected:bg-accent aria-selected:text-accent-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <span>Go to Dashboard</span>
            </Command.Item>
            <Command.Item
              value="go-to-patients-list"
              onSelect={() => handleNavigate("/patients")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                "text-sm text-foreground",
                "aria-selected:bg-accent aria-selected:text-accent-foreground"
              )}
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Go to Patients</span>
            </Command.Item>
            <Command.Item
              value="go-to-analytics-charts"
              onSelect={() => handleNavigate("/analytics")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                "text-sm text-foreground",
                "aria-selected:bg-accent aria-selected:text-accent-foreground"
              )}
            >
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span>Go to Analytics</span>
            </Command.Item>
            <Command.Item
              value="go-to-bed-settings"
              onSelect={() => handleNavigate("/settings")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                "text-sm text-foreground",
                "aria-selected:bg-accent aria-selected:text-accent-foreground"
              )}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Go to Bed Settings</span>
            </Command.Item>
            <Command.Item
              value="go-to-team-settings"
              onSelect={() => handleNavigate("/team/settings")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                "text-sm text-foreground",
                "aria-selected:bg-accent aria-selected:text-accent-foreground"
              )}
            >
              <UserCog className="h-4 w-4 text-muted-foreground" />
              <span>Go to Team Settings</span>
            </Command.Item>
          </Command.Group>

          {/* Theme */}
          <Command.Group
            heading="Theme"
            className="text-xs font-medium text-muted-foreground px-2 py-1.5"
          >
            <Command.Item
              value="theme-light-mode"
              onSelect={() => handleThemeChange("light")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                "text-sm text-foreground",
                "aria-selected:bg-accent aria-selected:text-accent-foreground"
              )}
            >
              <Sun className="h-4 w-4 text-muted-foreground" />
              <span>Light Mode</span>
              {theme === "light" && (
                <span className="ml-auto text-xs text-primary">Active</span>
              )}
            </Command.Item>
            <Command.Item
              value="theme-dark-mode"
              onSelect={() => handleThemeChange("dark")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                "text-sm text-foreground",
                "aria-selected:bg-accent aria-selected:text-accent-foreground"
              )}
            >
              <Moon className="h-4 w-4 text-muted-foreground" />
              <span>Dark Mode</span>
              {theme === "dark" && (
                <span className="ml-auto text-xs text-primary">Active</span>
              )}
            </Command.Item>
            <Command.Item
              value="theme-system-mode"
              onSelect={() => handleThemeChange("system")}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer",
                "text-sm text-foreground",
                "aria-selected:bg-accent aria-selected:text-accent-foreground"
              )}
            >
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span>System Theme</span>
              {theme === "system" && (
                <span className="ml-auto text-xs text-primary">Active</span>
              )}
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded">Esc</kbd> Close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
