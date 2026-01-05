import type { BedConfiguration } from "@/models/Beds";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export const bedConfigApi = {
  getAll: async (): Promise<BedConfiguration[]> => {
    const response = await fetch(`${API_BASE_URL}/api/bed-configurations`);
    const result: ApiResponse<BedConfiguration[]> = await response.json();
    return result.data || [];
  },

  getById: async (id: string): Promise<BedConfiguration | null> => {
    const response = await fetch(`${API_BASE_URL}/api/bed-configurations/${id}`);
    const result: ApiResponse<BedConfiguration> = await response.json();
    return result.data || null;
  },

  create: async (config: Omit<BedConfiguration, 'id'>): Promise<BedConfiguration> => {
    const response = await fetch(`${API_BASE_URL}/api/bed-configurations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    const result: ApiResponse<BedConfiguration> = await response.json();
    return result.data!;
  },

  update: async (id: string, config: Partial<BedConfiguration>): Promise<BedConfiguration> => {
    const response = await fetch(`${API_BASE_URL}/api/bed-configurations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    const result: ApiResponse<BedConfiguration> = await response.json();
    return result.data!;
  },

  delete: async (id: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/api/bed-configurations/${id}`, {
      method: 'DELETE',
    });
  },
};

export interface Antibiotic {
  id: string;
  name: string;
  type: "antibiotic" | "corticoide";
  default_start_count: 0 | 1;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const bedApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/beds`);
    const result: ApiResponse<any[]> = await response.json();
    return result.data || [];
  },

  getByUnit: async (unit: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/api/beds?unit=${unit}`);
    const result: ApiResponse<any[]> = await response.json();
    return result.data || [];
  },
};

export const antibioticsApi = {
  getAll: async (): Promise<Antibiotic[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/antibiotics`, {
      headers: getAuthHeaders(),
    });
    const result: ApiResponse<Antibiotic[]> = await response.json();
    return result.data || [];
  },
};