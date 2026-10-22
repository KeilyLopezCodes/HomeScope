const express = require('express');
const cors = require('cors'); //para permitir que el frontend hable con este backend
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const placesRoutes = require('./routes/placesRoutes');
const propertyRoutes = require('./routes/property.routes');
const reportRoutes = require('./routes/report.routes');
const reviewRoutes = require('./routes/review.routes');
const sellerRoutes = require('./routes/seller.routes');
const mensajeriaRoutes = require('./routes/mensajeria.routes');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Swagger UI — disponible en /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'HomeScope API Docs',
  swaggerOptions: { persistAuthorization: true }
}));

// Spec JSON crudo (útil para herramientas externas)
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/properties', propertyRoutes)
app.use('/api/reportes', reportRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/v1', require('./routes/geo-indice.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/conversaciones', mensajeriaRoutes);

module.exports = app;