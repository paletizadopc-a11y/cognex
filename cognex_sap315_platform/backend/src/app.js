require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./models');

// Carga de enrutadores del sistema
const authRoutes = require('./routes/auth');
const lecturasRoutes = require('./routes/lecturas');
const usuariosRoutes = require('./routes/usuariosRoutes');
const configuracionRoutes = require('./routes/configuracion');

// 🚀 SOLUCIÓN: Importamos el nuevo archivo de rutas de logs de auditoría
const logsRoutes = require('./routes/logsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta absoluta frontend
const frontendPath = path.resolve(__dirname, '../../frontend/dist');

console.log('📁 Frontend path:', frontendPath);

// Seguridad (modo LAN / Planta local)
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS de acceso global para periféricos e interfaces
app.use(cors({
  origin: '*',
  credentials: true
}));

// Políticas contra saturación (Rate limiting)
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

// Logs operacionales en consola
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

// Body parsers configurados para permitir transferencias de auditorías Excel pesadas
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servidor de distribución de archivos estáticos de React
app.use(express.static(frontendPath));

// Prefijo dinámico de la API
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// ============================================================================
// REGISTRO DE RUTAS DE LA API (API ROUTES)
// ============================================================================

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

// 🚀 SOLUCIÓN: Montamos las rutas de auditoría bajo el prefijo raíz correlativo a Axios
app.use(
  `${API_PREFIX}`,
  apiLimiter,
  logsRoutes
);

// ============================================================================
// VERIFICACIONES Y FALLBACKS
// ============================================================================

// Health check para monitores de infraestructura
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// React Router HTML5 History API Fallback
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Inicialización de conexiones físicas y arranque del demonio HTTP
sequelize.sync()
  .then(() => {

    console.log('✅ Base de datos conectada y sincronizada de forma exitosa');

    app.listen(PORT, '0.0.0.0', () => {

      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌐 Red local industrial: http://10.3.33.48:${PORT}`);
      console.log(`📡 API activa en el prefijo: ${API_PREFIX}`);

    });

  })
  .catch(err => {

    console.error('❌ Error crítico al conectar la base de datos relacional:', err);

  });