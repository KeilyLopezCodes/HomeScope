const express = require('express');
//const healthRoutes = require('./routes/health.routes');
const cors = require('cors'); //para permitir que el frontend hable con este backend
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const placesRoutes = require('./routes/placesRoutes');
const propertyRoutes = require('./routes/property.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

//permite que el frontend hable con este backend
app.use(cors({origin: process.env.FRONTEND_URL || 'http://localhost:5173'}));

app.use(express.json());

// Swagger UI — disponible en /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'HomeScope API Docs',
  swaggerOptions: { persistAuthorization: true }
}));

// Spec JSON crudo (útil para herramientas externas)
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// Usar la ruta de health
//app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/properties', propertyRoutes)
app.use('/api/reportes', reportRoutes);

module.exports = app;