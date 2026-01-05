import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PatientsPage } from "@/pages/PatientsPage";
import type { ReactNode } from "react";

vi.mock("react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe("PatientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    render(<PatientsPage />);
    expect(screen.getByRole("heading", { name: /biotrack patients/i })).toBeInTheDocument();
  });

  it("renders settings link", () => {
    render(<PatientsPage />);
    const settingsLink = screen.getByRole("link", { name: /settings/i });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("renders patient list", () => {
    render(<PatientsPage />);
    expect(screen.getByText(/patients found/i)).toBeInTheDocument();
  });

  it("renders Add Patient button", () => {
    render(<PatientsPage />);
    expect(screen.getByRole("button", { name: /add patient/i })).toBeInTheDocument();
  });
});
