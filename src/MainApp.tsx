import { useUnitsRealtimeUpdates } from "./services/useUnitsRealtimeUpdates";
import { StrictMode } from "react";
import { RouterProvider } from "react-router";
import { router } from "./router/router.app";

export function MainApp() {
  useUnitsRealtimeUpdates();
  return (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
