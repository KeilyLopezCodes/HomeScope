const express = require('express');
//const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const propertyRoutes = require('./routes/property.routes');

const app = express();

app.use(express.json());

// Usar la ruta de health
//app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

module.exports = app;