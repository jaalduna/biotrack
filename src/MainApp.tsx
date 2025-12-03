// import { useUnitsRealtimeUpdates } from "./services/useUnitsRealtimeUpdates";
import { StrictMode } from "react";
import { RouterProvider } from "react-router";
import { router } from "./router/router.app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function MainApp() {
  // useUnitsRealtimeUpdates();
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  );
}
