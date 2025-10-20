import { BioTrack } from "@/BioTrack";
import { PatientsPage } from "@/pages/PatientsPage";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <BioTrack />,
  },
  { path: "/patients", element: <PatientsPage /> },
]);
