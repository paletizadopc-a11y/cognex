require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const lecturasRoutes = require('./routes/lecturas');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones, intente más tarde'
});
app.use('/api/', limiter);

// Logging
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use(`/api/${process.env.API_VERSION || 'v1'}/auth`, authRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/lecturas`, lecturasRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Sincronizar DB y arrancar
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Base de datos sincronizada');
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Error conectando a la base de datos:', err);
});