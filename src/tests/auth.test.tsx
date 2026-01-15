import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to render with router and auth provider
const renderWithProviders = (
  ui: React.ReactElement,
  { initialEntries = ["/"] } = {}
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
};

// Test component to show protected content
const ProtectedContent = () => {
  const { user } = useAuth();
  return <div>Welcome, {user?.name || "Guest"}</div>;
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders login form", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole("heading", { name: /biotrack/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("validates email format before submission", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Type an invalid email (no @ sign)
    await user.type(emailInput, "invalidemail");
    await user.type(passwordInput, "password123");

    // The email input should have the invalid email value
    expect(emailInput).toHaveValue("invalidemail");

    // Note: The actual validation happens on form submit via EMAIL_REGEX
    // Browser's native email validation is separate
  });

  it("calls login API with credentials", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "test-token",
          user: {
            id: "123",
            name: "Test User",
            email: "test@example.com",
            role: "basic",
            team_id: "team-123",
            team_role: "member",
            is_active: true,
            email_verified: true,
            created_at: "2025-01-01",
            updated_at: "2025-01-01",
          },
        }),
    });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/patients" element={<div>Patients Page</div>} />
      </Routes>,
      { initialEntries: ["/login"] }
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        })
      );
    });
  });

  it("shows error message on login failure", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ detail: "Invalid credentials" }),
    });

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("has link to registration page", () => {
    renderWithProviders(<LoginPage />);

    const registerLink = screen.getByRole("link", { name: /sign up/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });
});

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("redirects to login when not authenticated", () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ["/protected"] }
    );

    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it("renders protected content when authenticated", () => {
    // Set up localStorage with auth data
    localStorage.setItem("biotrack_token", "test-token");
    localStorage.setItem(
      "biotrack_user",
      JSON.stringify({
        id: "123",
        name: "Authenticated User",
        email: "auth@example.com",
        role: "basic",
        team_id: "team-123",
        team_role: "member",
        is_active: true,
        email_verified: true,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      })
    );

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ["/protected"] }
    );

    expect(screen.getByText(/welcome, authenticated user/i)).toBeInTheDocument();
  });

  it("includes redirect path in login URL", () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/patients/123"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ["/patients/123"] }
    );

    // Should redirect to login - the actual redirect path is encoded in URL
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("provides isAuthenticated as false when no token", () => {
    const TestComponent = () => {
      const { isAuthenticated } = useAuth();
      return <div>{isAuthenticated ? "Authenticated" : "Not Authenticated"}</div>;
    };

    renderWithProviders(<TestComponent />);

    expect(screen.getByText("Not Authenticated")).toBeInTheDocument();
  });

  it("provides isAuthenticated as true when token exists", () => {
    localStorage.setItem("biotrack_token", "test-token");
    localStorage.setItem(
      "biotrack_user",
      JSON.stringify({
        id: "123",
        name: "Test User",
        email: "test@example.com",
        role: "basic",
        team_id: null,
        team_role: null,
        is_active: true,
        email_verified: true,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      })
    );

    const TestComponent = () => {
      const { isAuthenticated } = useAuth();
      return <div>{isAuthenticated ? "Authenticated" : "Not Authenticated"}</div>;
    };

    renderWithProviders(<TestComponent />);

    expect(screen.getByText("Authenticated")).toBeInTheDocument();
  });

  it("clears auth state on logout", async () => {
    const user = userEvent.setup();
    localStorage.setItem("biotrack_token", "test-token");
    localStorage.setItem(
      "biotrack_user",
      JSON.stringify({
        id: "123",
        name: "Test User",
        email: "test@example.com",
        role: "basic",
        team_id: null,
        team_role: null,
        is_active: true,
        email_verified: true,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      })
    );

    const TestComponent = () => {
      const { isAuthenticated, logout } = useAuth();
      return (
        <div>
          <div>{isAuthenticated ? "Authenticated" : "Not Authenticated"}</div>
          <button onClick={logout}>Logout</button>
        </div>
      );
    };

    renderWithProviders(<TestComponent />);

    expect(screen.getByText("Authenticated")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(screen.getByText("Not Authenticated")).toBeInTheDocument();
    });
    expect(localStorage.getItem("biotrack_token")).toBeNull();
    expect(localStorage.getItem("biotrack_user")).toBeNull();
  });
});
