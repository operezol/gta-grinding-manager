const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const gtaRoutes = require('./src/routes/gtaRoutes');
app.use('/api/gta', gtaRoutes);

app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Serve frontend
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`GTA Grinding Manager running on http://localhost:${PORT}`);
});

module.exports = app;
