import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PatientsPage } from '@/pages/PatientsPage';
import { mockPatients } from '@/services/MockApi';

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

describe('PatientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings icon button', () => {
    render(<PatientsPage />);
    
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  it('navigates to settings when settings icon is clicked', async () => {
    render(<PatientsPage />);
    
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    await userEvent.click(settingsLink);
    
    expect(window.location.pathname).toBe('/settings');
  });

  it('filters patients by bed number', async () => {
    render(<PatientsPage />);
    
    const bedSelect = screen.getByLabelText(/bed/i);
    await userEvent.click(bedSelect);
    await userEvent.click(screen.getByText('Bed 5'));
    
    expect(screen.getByText(/patients found/i)).toBeInTheDocument();
  });

  it('shows patient bed information', () => {
    const patientWithBed = {
      ...mockPatients[0],
      bedNumber: 5
    };
    
    vi.doMock('@/services/MockApi', async (importOriginal) => {
      const mod = await importOriginal();
      return {
        ...mod,
        mockPatients: [patientWithBed]
      };
    });
    
    render(<PatientsPage />);
    
    expect(screen.getByText('Bed 5')).toBeInTheDocument();
  });
});