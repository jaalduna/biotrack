import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = 3001;
const DB_FILE = path.join(process.cwd(), 'data', 'bed-configurations.json');

app.use(cors());
app.use(express.json());

interface BedConfiguration {
  id: string;
  unit: string;
  bedCount: number;
  startNumber: number;
  endNumber: number;
}

const loadData = async (): Promise<BedConfiguration[]> => {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const saveData = async (data: BedConfiguration[]): Promise<void> => {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
};

app.get('/api/bed-configurations', async (req, res) => {
  try {
    const configurations = await loadData();
    res.json({ data: configurations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load configurations' });
  }
});

app.get('/api/bed-configurations/:id', async (req, res) => {
  try {
    const configurations = await loadData();
    const config = configurations.find(c => c.id === req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json({ data: config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

app.post('/api/bed-configurations', async (req, res) => {
  try {
    const configurations = await loadData();
    const newConfig: BedConfiguration = {
      id: uuidv4(),
      ...req.body,
      endNumber: req.body.startNumber + req.body.bedCount - 1
    };
    configurations.push(newConfig);
    await saveData(configurations);
    res.json({ data: newConfig });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

app.put('/api/bed-configurations/:id', async (req, res) => {
  try {
    const configurations = await loadData();
    const index = configurations.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    configurations[index] = {
      ...configurations[index],
      ...req.body,
      endNumber: req.body.startNumber + req.body.bedCount - 1
    };
    await saveData(configurations);
    res.json({ data: configurations[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

app.delete('/api/bed-configurations/:id', async (req, res) => {
  try {
    const configurations = await loadData();
    const index = configurations.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    configurations.splice(index, 1);
    await saveData(configurations);
    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
});

app.get('/api/beds', async (req, res) => {
  try {
    const configurations = await loadData();
    const { unit } = req.query;
    
    let beds: any[] = [];
    configurations.forEach(config => {
      for (let i = config.startNumber; i <= config.endNumber; i++) {
        beds.push({
          id: `${config.unit}-${i}`,
          number: i,
          unit: config.unit,
          status: 'available'
        });
      }
    });
    
    if (unit && typeof unit === 'string') {
      beds = beds.filter(bed => bed.unit === unit);
    }
    
    res.json({ data: beds });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load beds' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});