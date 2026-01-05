import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { BedSettingsPage } from '@/pages/BedSettingsPage';
import { bedConfigApi } from '@/services/Api';

vi.mock('@/services/Api', () => ({
  bedConfigApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('BedSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    bedConfigApi.getAll.mockResolvedValue([]);
    
    render(<BedSettingsPage />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    bedConfigApi.getAll.mockRejectedValue(new Error('Network error'));
    
    render(<BedSettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('renders bed configurations list', async () => {
    const mockConfigs = [
      {
        id: '1',
        unit: 'UCI',
        bedCount: 17,
        startNumber: 1,
        endNumber: 17
      },
      {
        id: '2',
        unit: 'UTI',
        bedCount: 17,
        startNumber: 18,
        endNumber: 34
      }
    ];
    
    bedConfigApi.getAll.mockResolvedValue(mockConfigs);
    
    render(<BedSettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Bed Settings')).toBeInTheDocument();
      expect(screen.getByText('UCI')).toBeInTheDocument();
      expect(screen.getByText('UTI')).toBeInTheDocument();
      expect(screen.getByText('Beds 1 to 17 (17 beds)')).toBeInTheDocument();
      expect(screen.getByText('Beds 18 to 34 (17 beds)')).toBeInTheDocument();
    });
  });

  it('opens add unit dialog when Add Unit button is clicked', async () => {
    bedConfigApi.getAll.mockResolvedValue([]);
    
    render(<BedSettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Bed Settings')).toBeInTheDocument();
    });
    
    const addButton = screen.getByText('Add Unit');
    await userEvent.click(addButton);
    
    expect(screen.getByText('Add New Unit')).toBeInTheDocument();
    expect(screen.getByText('Configure a new unit with bed numbering.')).toBeInTheDocument();
  });

  it('creates new unit configuration', async () => {
    const newConfig = {
      id: '123',
      unit: 'UCI',
      bedCount: 10,
      startNumber: 1,
      endNumber: 10
    };
    
    bedConfigApi.getAll.mockResolvedValue([]);
    bedConfigApi.create.mockResolvedValue(newConfig);
    
    render(<BedSettingsPage />);
    
    await waitFor(() => {
      const addButton = screen.getByText('Add Unit');
      expect(addButton).toBeInTheDocument();
    });
    
    await userEvent.click(screen.getByText('Add Unit'));
    
    const unitSelect = screen.getByLabelText('Unit Name');
    await userEvent.click(unitSelect);
    await userEvent.click(screen.getByText('UCI'));
    
    const bedCountInput = screen.getByLabelText('Number of Beds');
    await userEvent.clear(bedCountInput);
    await userEvent.type(bedCountInput, '10');
    
    const startNumberInput = screen.getByLabelText('Start Number');
    await userEvent.clear(startNumberInput);
    await userEvent.type(startNumberInput, '1');
    
    await userEvent.click(screen.getByText('Add Unit'));
    
    expect(bedConfigApi.create).toHaveBeenCalledWith({
      unit: 'UCI',
      bedCount: 10,
      startNumber: 1
    });
  });

  it('updates existing unit configuration', async () => {
    const existingConfigs = [
      {
        id: '1',
        unit: 'UCI',
        bedCount: 17,
        startNumber: 1,
        endNumber: 17
      }
    ];
    
    const updatedConfig = {
      ...existingConfigs[0],
      unit: 'UTI',
      bedCount: 20
    };
    
    bedConfigApi.getAll.mockResolvedValue(existingConfigs);
    bedConfigApi.update.mockResolvedValue(updatedConfig);
    
    render(<BedSettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('UCI')).toBeInTheDocument();
    });
    
    const editButton = screen.getAllByLabelText('Edit configuration')[0];
    await userEvent.click(editButton);
    
    expect(screen.getByText('Edit Unit')).toBeInTheDocument();
    
    const unitSelect = screen.getByLabelText('Unit Name');
    await userEvent.click(unitSelect);
    await userEvent.click(screen.getByText('UTI'));
    
    const bedCountInput = screen.getByLabelText('Number of Beds');
    await userEvent.clear(bedCountInput);
    await userEvent.type(bedCountInput, '20');
    
    await userEvent.click(screen.getByText('Update Unit'));
    
    expect(bedConfigApi.update).toHaveBeenCalledWith('1', {
      unit: 'UTI',
      bedCount: 20
    });
  });

  it('deletes unit configuration', async () => {
    const existingConfigs = [
      {
        id: '1',
        unit: 'UCI',
        bedCount: 17,
        startNumber: 1,
        endNumber: 17
      }
    ];
    
    bedConfigApi.getAll.mockResolvedValue(existingConfigs);
    bedConfigApi.delete.mockResolvedValue(undefined);
    
    global.confirm = vi.fn().mockReturnValue(true);
    
    render(<BedSettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('UCI')).toBeInTheDocument();
    });
    
    const deleteButton = screen.getAllByLabelText('Delete configuration')[0];
    await userEvent.click(deleteButton);
    
    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this unit configuration?');
    expect(bedConfigApi.delete).toHaveBeenCalledWith('1');
  });

  it('shows calculated end number', async () => {
    bedConfigApi.getAll.mockResolvedValue([]);
    
    render(<BedSettingsPage />);
    
    await userEvent.click(screen.getByText('Add Unit'));
    
    const bedCountInput = screen.getByLabelText('Number of Beds');
    const startNumberInput = screen.getByLabelText('Start Number');
    
    await userEvent.clear(bedCountInput);
    await userEvent.type(bedCountInput, '15');
    
    await userEvent.clear(startNumberInput);
    await userEvent.type(startNumberInput, '10');
    
    expect(screen.getByText('24')).toBeInTheDocument();
  });
});