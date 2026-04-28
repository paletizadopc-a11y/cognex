require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const lecturasRoutes = require('./routes/lecturas');
const usuariosRoutes = require('./routes/usuariosRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Demasiados intentos de login, intente más tarde'
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 5000, 
  message: 'Límite de peticiones excedido'
});

app.use(morgan(process.env.LOG_LEVEL || 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use(`/api/${process.env.API_VERSION || 'v1'}/auth`, authLimiter, authRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/lecturas`, apiLimiter, lecturasRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}`, usuariosRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Sincronizar DB y arrancar
// 🚀 Usamos sync() normal ya que la columna 'activo' ya fue creada manualmente
sequelize.sync().then(() => {
  console.log('✅ Base de datos conectada y sincronizada');
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Error conectando a la base de datos:', err);
});