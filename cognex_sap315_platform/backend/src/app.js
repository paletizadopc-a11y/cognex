require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const lecturasRoutes = require('./routes/lecturas');
const usuariosRoutes = require('./routes/usuariosRoutes');
const configuracionRoutes = require('./routes/configuracion');

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta absoluta frontend
const frontendPath = path.resolve(__dirname, '../../frontend/dist');

console.log('📁 Frontend path:', frontendPath);

// Seguridad (modo LAN/local)
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(cors({
  origin: '*',
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

// Logs
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos React
app.use(express.static(frontendPath));

// Prefijo API
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// API routes
app.use(
  `${API_PREFIX}/auth`,
  authLimiter,
  authRoutes
);

app.use(
  `${API_PREFIX}/lecturas`,
  apiLimiter,
  lecturasRoutes
);

app.use(
  `${API_PREFIX}`,
  usuariosRoutes
);

app.use(
  `${API_PREFIX}/configuracion`,
  apiLimiter,
  configuracionRoutes
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// React fallback
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Inicio servidor
sequelize.sync()
  .then(() => {

    console.log('✅ Base de datos conectada y sincronizada');

    app.listen(PORT, '0.0.0.0', () => {

      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌐 Red local: http://10.3.33.48:${PORT}`);
      console.log(`📡 API activa en ${API_PREFIX}`);

    });

  })
  .catch(err => {

    console.error('❌ Error conectando a la base de datos:', err);

  });