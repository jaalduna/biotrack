import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router"; // Changed
import { router } from "./router/router.app";
import { AuthProvider } from "./contexts/AuthContext";
import { TeamProvider } from "./contexts/TeamContext";
import { Toaster } from "./components/Toaster";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <TeamProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TeamProvider>
    </AuthProvider>
  </StrictMode>,
);
