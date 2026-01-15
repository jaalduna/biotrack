import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { PatientsPage } from "@/pages/PatientsPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { UnitsProvider } from "@/contexts/UnitsContext";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to render with providers
const renderWithProviders = (
  ui: React.ReactElement,
  { initialEntries = ["/"] } = {}
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <UnitsProvider>{ui}</UnitsProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("PatientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Set up auth state for tests
    localStorage.setItem("biotrack_token", "test-token");
    localStorage.setItem(
      "biotrack_user",
      JSON.stringify({
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
      })
    );
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  it("renders page title", () => {
    renderWithProviders(<PatientsPage />);
    expect(screen.getByRole("heading", { name: /biotrack patients/i })).toBeInTheDocument();
  });

  it("renders filter section", () => {
    renderWithProviders(<PatientsPage />);
    expect(screen.getByRole("heading", { name: /filter patients/i })).toBeInTheDocument();
  });

  it("renders refresh button", () => {
    renderWithProviders(<PatientsPage />);
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("renders New Patient button", () => {
    renderWithProviders(<PatientsPage />);
    // Use exact name to avoid matching both desktop and mobile buttons
    expect(screen.getByRole("button", { name: "New Patient" })).toBeInTheDocument();
  });
});
