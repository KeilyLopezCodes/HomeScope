const express = require('express');
//const healthRoutes = require('./routes/health.routes');
const cors = require('cors'); //para permitir que el frontend hable con este backend
const authRoutes = require('./routes/auth.routes');
const placesRoutes = require('./routes/placesRoutes');
const propertyRoutes = require('./routes/property.routes');

const app = express();

//permite que el frontend hable con este backend
app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:5173'}));

app.use(express.json());

// Usar la ruta de health
//app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/properties', propertyRoutes)

module.exports = app;