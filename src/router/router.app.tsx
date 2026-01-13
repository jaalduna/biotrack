import { PatientDetailPage } from "@/pages/PatientsDetailPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { BedSettingsPage } from "@/pages/BedSettingsPage";
import { TeamManagementPage } from "@/pages/TeamManagementPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
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
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: "dashboard",
          element: <DashboardPage />,
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
          path: "analytics",
          element: <AnalyticsPage />,
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
