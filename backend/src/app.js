const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const placesRoutes = require('./routes/placesRoutes');
const propertyRoutes = require('./routes/property.routes');

const app = express();

app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:5173'}));
app.use(express.json());

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/properties', propertyRoutes);

module.exports = app;