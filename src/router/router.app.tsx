import { PatientDetailPage } from "@/pages/PatientsDetailPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { TeamManagementPage } from "@/pages/TeamManagementPage";
import { TeamSetupPage } from "@/pages/TeamSetupPage";
import { SubscriptionCheckoutPage } from "@/pages/SubscriptionCheckoutPage";
import { AcceptInvitationPage } from "@/pages/AcceptInvitationPage";
import { VerifyEmailSentPage } from "@/pages/VerifyEmailSentPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";
import { BetaLoginPage } from "@/pages/BetaLoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createBrowserRouter, Navigate } from "react-router";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Navigate to="/beta" replace />,
    },
    { path: "/beta", element: <BetaLoginPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    {
      path: "/patients",
      element: (
        <ProtectedRoute>
          <PatientsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/patients/:id",
      element: (
        <ProtectedRoute>
          <PatientDetailPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/team/settings",
      element: (
        <ProtectedRoute>
          <TeamManagementPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/team/setup",
      element: (
        <ProtectedRoute>
          <TeamSetupPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/subscription/checkout",
      element: (
        <ProtectedRoute>
          <SubscriptionCheckoutPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/invitations/accept/:token",
      element: <AcceptInvitationPage />,
    },
    {
      path: "/verify-email-sent",
      element: <VerifyEmailSentPage />,
    },
    {
      path: "/verify-email/:token",
      element: <VerifyEmailPage />,
    },
  ],
  { basename: "/biotrack" },
);
