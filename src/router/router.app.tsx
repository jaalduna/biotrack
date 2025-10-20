import { BioTrack } from "@/BioTrack";
import { PatientDetailPage } from "@/pages/PatientsDetailPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <BioTrack />,
    },
    { path: "/patients", element: <PatientsPage /> },
    {
      path: "/patients/:id",
      element: <PatientDetailPage />,
    },
  ],
  { basename: "/biotrack" },
);
