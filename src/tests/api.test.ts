import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  href: "",
  pathname: "/biotrack/patients",
  search: "?filter=active",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("API 401 Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockLocation.href = "";
    mockLocation.pathname = "/biotrack/patients";
    mockLocation.search = "?filter=active";

    // Reset module cache to get fresh API module
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns response normally for successful requests", async () => {
    localStorage.setItem("biotrack_token", "valid-token");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ id: "1", name: "Patient 1" }]),
    });

    // Import API after setting up mocks
    const { patientsApi } = await import("@/services/Api");

    const patients = await patientsApi.getAll();
    expect(patients).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("clears auth data on 401 response", async () => {
    localStorage.setItem("biotrack_token", "expired-token");
    localStorage.setItem("biotrack_user", JSON.stringify({ id: "1", name: "Test" }));

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: "Token expired" }),
    });

    const { patientsApi } = await import("@/services/Api");

    await expect(patientsApi.getAll()).rejects.toThrow("Session expired");

    // Verify auth data was cleared
    expect(localStorage.getItem("biotrack_token")).toBeNull();
    expect(localStorage.getItem("biotrack_user")).toBeNull();
    expect(localStorage.getItem("biotrack_beta_mode")).toBeNull();
  });

  it("redirects to login with current path on 401", async () => {
    localStorage.setItem("biotrack_token", "expired-token");
    mockLocation.pathname = "/biotrack/patients/123";
    mockLocation.search = "";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: "Unauthorized" }),
    });

    const { patientsApi } = await import("@/services/Api");

    await expect(patientsApi.getById("123")).rejects.toThrow("Session expired");

    // Verify redirect URL includes the original path
    expect(mockLocation.href).toContain("/biotrack/login");
    expect(mockLocation.href).toContain("redirect=");
    expect(mockLocation.href).toContain(encodeURIComponent("/biotrack/patients/123"));
  });

  it("does NOT redirect on 401 in beta mode", async () => {
    localStorage.setItem("biotrack_beta_mode", "true");
    localStorage.setItem("biotrack_token", "beta-token");

    // Beta mode returns mock data, so fetch won't be called
    const { patientsApi } = await import("@/services/Api");

    // In beta mode, API should return mock data
    const patients = await patientsApi.getAll();
    expect(patients).toBeDefined();
    expect(Array.isArray(patients)).toBe(true);

    // Auth data should still be present (not cleared)
    expect(localStorage.getItem("biotrack_beta_mode")).toBe("true");
    expect(localStorage.getItem("biotrack_token")).toBe("beta-token");

    // No redirect should have occurred
    expect(mockLocation.href).toBe("");
  });

  it("throws error with session expired message on 401", async () => {
    localStorage.setItem("biotrack_token", "expired-token");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: "Invalid token" }),
    });

    const { patientsApi } = await import("@/services/Api");

    await expect(patientsApi.getAll()).rejects.toThrow("Session expired. Please log in again.");
  });

  it("includes Authorization header with token", async () => {
    localStorage.setItem("biotrack_token", "my-jwt-token");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    const { patientsApi } = await import("@/services/Api");

    await patientsApi.getAll();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/patients"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Authorization": "Bearer my-jwt-token",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("does not include Authorization header when no token", async () => {
    // No token in localStorage
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    const { patientsApi } = await import("@/services/Api");

    await patientsApi.getAll();

    const calledOptions = mockFetch.mock.calls[0][1];
    expect(calledOptions.headers["Authorization"]).toBeUndefined();
  });

  it("preserves query parameters in redirect path on 401", async () => {
    localStorage.setItem("biotrack_token", "expired-token");
    mockLocation.pathname = "/biotrack/patients";
    mockLocation.search = "?unit=UCI&status=active";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: "Unauthorized" }),
    });

    const { patientsApi } = await import("@/services/Api");

    await expect(patientsApi.getAll()).rejects.toThrow("Session expired");

    // Verify redirect URL includes path AND query params
    const expectedPath = "/biotrack/patients?unit=UCI&status=active";
    expect(mockLocation.href).toContain(encodeURIComponent(expectedPath));
  });
});

describe("API Authentication Headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.resetModules();
  });

  it("sends POST requests with correct headers and body", async () => {
    localStorage.setItem("biotrack_token", "test-token");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({
        id: "new-patient",
        rut: "12.345.678-9",
        name: "New Patient",
        age: 30,
        status: "active",
        unit: "UCI",
        bed_number: 1,
        has_ending_soon_program: false,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      }),
    });

    const { patientsApi } = await import("@/services/Api");

    const newPatient = await patientsApi.create({
      rut: "12.345.678-9",
      name: "New Patient",
      age: 30,
      status: "active",
      unit: "UCI",
      bedNumber: 1,
      hasEndingSoonProgram: false,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/patients"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Authorization": "Bearer test-token",
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      })
    );

    expect(newPatient.name).toBe("New Patient");
  });

  it("handles other error statuses without triggering 401 redirect", async () => {
    localStorage.setItem("biotrack_token", "valid-token");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({ detail: "Patient not found" }),
    });

    const { patientsApi } = await import("@/services/Api");

    await expect(patientsApi.getById("nonexistent")).rejects.toThrow("Failed to fetch patient");

    // Token should still be present (not cleared by 404)
    expect(localStorage.getItem("biotrack_token")).toBe("valid-token");
  });
});
