import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { HashRouter, RouterProvider } from "react-router"; // Changed
import { router } from "./router/router.app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <RouterProvider router={router} />
    </HashRouter>
  </StrictMode>,
);
