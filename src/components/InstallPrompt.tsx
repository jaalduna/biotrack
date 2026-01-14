import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - Safari-specific property
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user hasn't dismissed the prompt recently
      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) {
        // Show prompt after a delay to not interrupt initial experience
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful installation
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log("[Install] PWA was installed");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[Install] User response:", outcome);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    setTimeout(() => {
      localStorage.removeItem("pwa-prompt-dismissed");
    }, 7 * 24 * 60 * 60 * 1000);
  };

  // Don't show if already installed
  if (isStandalone) return null;

  // Don't show prompt
  if (!showPrompt) return null;

  return (
    <div
      className={cn(
        "fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm",
        "bg-card border border-border rounded-xl shadow-2xl p-4",
        "animate-in slide-in-from-bottom-5 duration-300"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">Install BioTrack</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isIOS
              ? "Tap the share button and 'Add to Home Screen' to install."
              : "Add BioTrack to your home screen for quick access."}
          </p>

          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="mt-3 gap-2"
            >
              <Download className="h-4 w-4" />
              Install App
            </Button>
          )}

          {isIOS && (
            <div className="mt-3 text-xs text-muted-foreground">
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Tap the <span className="font-medium">Share</span> button
                </li>
                <li>
                  Select <span className="font-medium">Add to Home Screen</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
