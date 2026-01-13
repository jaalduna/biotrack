import { PatientDetailPage } from "@/pages/PatientsDetailPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { BedSettingsPage } from "@/pages/BedSettingsPage";
import { TeamManagementPage } from "@/pages/TeamManagementPage";
import { AppLayout } from "@/components/AppLayout";
import { createBrowserRouter, Navigate } from "react-router";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: <Navigate to="/patients" replace />,
        },
        {
          path: "patients",
          element: <PatientsPage />,
        },
        {
          path: "patients/:id",
          element: <PatientDetailPage />,
        },
        {
          path: "settings",
          element: <BedSettingsPage />,
        },
        {
          path: "team/settings",
          element: <TeamManagementPage />,
        },
      ],
    },
  ],
  { basename: "/biotrack" }
);
