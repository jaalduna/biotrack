import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { BedSettingsPage } from "@/pages/BedSettingsPage";
import { bedConfigApi } from "@/services/Api";

vi.mock("@/services/Api", () => ({
  bedConfigApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGetAll = bedConfigApi.getAll as Mock;
const mockedDelete = bedConfigApi.delete as Mock;

describe("BedSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockedGetAll.mockResolvedValue([]);
    render(<BedSettingsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders error state when API fails", async () => {
    mockedGetAll.mockRejectedValue(new Error("Network error"));
    render(<BedSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("renders bed configurations list", async () => {
    const mockConfigs = [
      { id: "1", unit: "UCI", bedCount: 17, startNumber: 1, endNumber: 17 },
      { id: "2", unit: "UTI", bedCount: 17, startNumber: 18, endNumber: 34 },
    ];

    mockedGetAll.mockResolvedValue(mockConfigs);
    render(<BedSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Bed Settings")).toBeInTheDocument();
      expect(screen.getByText("UCI")).toBeInTheDocument();
      expect(screen.getByText("UTI")).toBeInTheDocument();
      expect(screen.getByText("Beds 1 to 17 (17 beds)")).toBeInTheDocument();
      expect(screen.getByText("Beds 18 to 34 (17 beds)")).toBeInTheDocument();
    });
  });

  it("opens add unit dialog when Add Unit button is clicked", async () => {
    mockedGetAll.mockResolvedValue([]);
    render(<BedSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Bed Settings")).toBeInTheDocument();
    });

    const addButton = screen.getByText("Add Unit");
    await userEvent.click(addButton);

    expect(screen.getByText("Add New Unit")).toBeInTheDocument();
    expect(
      screen.getByText("Configure a new unit with bed numbering.")
    ).toBeInTheDocument();
  });

  it("shows calculated end number in dialog", async () => {
    mockedGetAll.mockResolvedValue([]);
    render(<BedSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Bed Settings")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Add Unit"));

    const bedCountInput = screen.getByLabelText("Number of Beds");
    const startNumberInput = screen.getByLabelText("Start Number");

    await userEvent.clear(bedCountInput);
    await userEvent.type(bedCountInput, "15");

    await userEvent.clear(startNumberInput);
    await userEvent.type(startNumberInput, "10");

    expect(screen.getByText("24")).toBeInTheDocument();
  });

  it("deletes unit configuration", async () => {
    const existingConfigs = [
      { id: "1", unit: "UCI", bedCount: 17, startNumber: 1, endNumber: 17 },
    ];

    mockedGetAll.mockResolvedValue(existingConfigs);
    mockedDelete.mockResolvedValue(undefined);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<BedSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("UCI")).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText("Delete configuration");
    await userEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Are you sure you want to delete this unit configuration?"
    );
    expect(mockedDelete).toHaveBeenCalledWith("1");

    confirmSpy.mockRestore();
  });

  it("opens edit dialog when edit button is clicked", async () => {
    const existingConfigs = [
      { id: "1", unit: "UCI", bedCount: 17, startNumber: 1, endNumber: 17 },
    ];

    mockedGetAll.mockResolvedValue(existingConfigs);
    render(<BedSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("UCI")).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText("Edit configuration");
    await userEvent.click(editButton);

    expect(screen.getByText("Edit Unit")).toBeInTheDocument();
  });
});
