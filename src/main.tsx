import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router";
import { router } from "./router/router.app";
import { AuthProvider } from "./contexts/AuthContext";
import { TeamProvider } from "./contexts/TeamContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/Toaster";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TeamProvider>
          <SidebarProvider>
            <RouterProvider router={router} />
            <Toaster />
          </SidebarProvider>
        </TeamProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
