const express = require('express');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(express.json());

// Usar la ruta de health
app.use('/api', healthRoutes);

module.exports = app;