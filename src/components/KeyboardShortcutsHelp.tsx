import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface ShortcutInfo {
  key: string;
  description: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: ShortcutInfo[];
}

export function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "?" && event.shiftKey) {
        event.preventDefault();
        setOpen(true);
      }

      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const formatKey = (shortcut: ShortcutInfo) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push("Ctrl");
    if (shortcut.alt) parts.push("Alt");
    if (shortcut.shift) parts.push("Shift");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {/* Global shortcuts */}
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">
              Command palette
            </span>
            <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded-md">
              ⌘/Ctrl + K
            </kbd>
          </div>

          {/* Page-specific shortcuts */}
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded-md">
                {formatKey(shortcut)}
              </kbd>
            </div>
          ))}
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">
                Show this help
              </span>
              <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded-md">
                ?
              </kbd>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
