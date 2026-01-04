import request from 'supertest';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const app = require('../index.js');
const DB_FILE = path.join(process.cwd(), 'data', 'bed-configurations.json');

interface BedConfiguration {
  id: string;
  unit: string;
  bedCount: number;
  startNumber: number;
  endNumber: number;
}

const clearDatabase = async () => {
  try {
    await fs.writeFile(DB_FILE, '[]');
  } catch {
  }
};

describe('Bed Configurations API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/bed-configurations', () => {
    it('returns empty list when no configurations exist', async () => {
      const response = await request(app)
        .get('/api/bed-configurations')
        .expect(200);
      
      expect(response.body).toEqual({ data: [] });
    });

    it('returns list of configurations when they exist', async () => {
      const testConfigs: BedConfiguration[] = [
        {
          id: '1',
          unit: 'UCI',
          bedCount: 17,
          startNumber: 1,
          endNumber: 17
        }
      ];
      
      await fs.writeFile(DB_FILE, JSON.stringify(testConfigs));
      
      const response = await request(app)
        .get('/api/bed-configurations')
        .expect(200);
      
      expect(response.body).toEqual({ data: testConfigs });
    });
  });

  describe('POST /api/bed-configurations', () => {
    it('creates new configuration', async () => {
      const newConfig = {
        unit: 'UCI',
        bedCount: 10,
        startNumber: 1
      };
      
      const response = await request(app)
        .post('/api/bed-configurations')
        .send(newConfig)
        .expect(200);
      
      expect(response.body.data).toMatchObject({
        unit: 'UCI',
        bedCount: 10,
        startNumber: 1,
        endNumber: 10
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('calculates end number correctly', async () => {
      const newConfig = {
        unit: 'UTI',
        bedCount: 5,
        startNumber: 20
      };
      
      const response = await request(app)
        .post('/api/bed-configurations')
        .send(newConfig)
        .expect(200);
      
      expect(response.body.data.endNumber).toBe(24);
    });
  });

  describe('PUT /api/bed-configurations/:id', () => {
    beforeEach(async () => {
      const initialConfigs: BedConfiguration[] = [
        {
          id: '1',
          unit: 'UCI',
          bedCount: 17,
          startNumber: 1,
          endNumber: 17
        }
      ];
      
      await fs.writeFile(DB_FILE, JSON.stringify(initialConfigs));
    });

    it('updates existing configuration', async () => {
      const updateData = {
        unit: 'UTI',
        bedCount: 20
      };
      
      const response = await request(app)
        .put('/api/bed-configurations/1')
        .send(updateData)
        .expect(200);
      
      expect(response.body.data).toMatchObject({
        id: '1',
        unit: 'UTI',
        bedCount: 20,
        startNumber: 1,
        endNumber: 20
      });
    });

    it('returns 404 for non-existent configuration', async () => {
      const response = await request(app)
        .put('/api/bed-configurations/999')
        .send({ unit: 'UTI' })
        .expect(404);
      
      expect(response.body.error).toBe('Configuration not found');
    });
  });

  describe('DELETE /api/bed-configurations/:id', () => {
    beforeEach(async () => {
      const initialConfigs: BedConfiguration[] = [
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
      
      await fs.writeFile(DB_FILE, JSON.stringify(initialConfigs));
    });

    it('deletes existing configuration', async () => {
      const response = await request(app)
        .delete('/api/bed-configurations/1')
        .expect(200);
      
      expect(response.body.message).toBe('Configuration deleted successfully');
    });

    it('returns 404 for non-existent configuration', async () => {
      const response = await request(app)
        .delete('/api/bed-configurations/999')
        .expect(404);
      
      expect(response.body.error).toBe('Configuration not found');
    });
  });

  describe('GET /api/beds', () => {
    beforeEach(async () => {
      const testConfigs: BedConfiguration[] = [
        {
          id: '1',
          unit: 'UCI',
          bedCount: 2,
          startNumber: 1,
          endNumber: 2
        },
        {
          id: '2',
          unit: 'UTI',
          bedCount: 3,
          startNumber: 5,
          endNumber: 7
        }
      ];
      
      await fs.writeFile(DB_FILE, JSON.stringify(testConfigs));
    });

    it('returns all beds across all units', async () => {
      const response = await request(app)
        .get('/api/beds')
        .expect(200);
      
      const beds = response.body.data;
      expect(beds).toHaveLength(5);
      expect(beds[0]).toMatchObject({
        id: 'UCI-1',
        number: 1,
        unit: 'UCI',
        status: 'available'
      });
      expect(beds[1]).toMatchObject({
        id: 'UCI-2',
        number: 2,
        unit: 'UCI',
        status: 'available'
      });
      expect(beds[2]).toMatchObject({
        id: 'UTI-5',
        number: 5,
        unit: 'UTI',
        status: 'available'
      });
    });

    it('filters beds by unit', async () => {
      const response = await request(app)
        .get('/api/beds?unit=UCI')
        .expect(200);
      
      const beds = response.body.data;
      expect(beds).toHaveLength(2);
      expect(beds.every(bed => bed.unit === 'UCI')).toBe(true);
    });
  });
});