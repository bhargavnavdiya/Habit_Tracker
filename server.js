const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Load data from file
async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { habits: [], data: {} };
    }
}

// Save data to file
async function saveData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all data
app.get('/api/data', async (req, res) => {
    try {
        const data = await loadData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save all data
app.post('/api/data', async (req, res) => {
    try {
        await saveData(req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get habits
app.get('/api/habits', async (req, res) => {
    try {
        const data = await loadData();
        res.json(data.habits || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save habits
app.post('/api/habits', async (req, res) => {
    try {
        const data = await loadData();
        data.habits = req.body;
        await saveData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update habit completion for a specific date
app.post('/api/habits/:habitId/toggle', async (req, res) => {
    try {
        const { habitId } = req.params;
        const { dateKey } = req.body;
        const data = await loadData();
        
        if (!data.data[dateKey]) {
            data.data[dateKey] = { habits: [], mood: null, motivation: null };
        }
        
        const index = data.data[dateKey].habits.indexOf(parseInt(habitId));
        if (index > -1) {
            data.data[dateKey].habits.splice(index, 1);
        } else {
            data.data[dateKey].habits.push(parseInt(habitId));
        }
        
        await saveData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update mental state
app.post('/api/mental-state', async (req, res) => {
    try {
        const { dateKey, type, value } = req.body;
        const data = await loadData();
        
        if (!data.data[dateKey]) {
            data.data[dateKey] = { habits: [], mood: null, motivation: null };
        }
        
        data.data[dateKey][type] = value;
        await saveData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Habit Tracker server running on http://localhost:${PORT}`);
    console.log(`📊 Open your browser and navigate to http://localhost:${PORT}`);
});


