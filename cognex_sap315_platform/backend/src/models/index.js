const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('roles', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_rol: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  descripcion: DataTypes.TEXT,
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true, createdAt: 'created_at', updatedAt: false });

const Usuario = sequelize.define('usuarios', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  ultimo_login: DataTypes.DATE,
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

// 🚀 TABLA LECTURAS ACTUALIZADA (Solo LPN y campos esenciales)
const Lectura = sequelize.define('lecturas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  lpn: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  fecha_hora: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado_sap: { type: DataTypes.STRING(20), defaultValue: 'pendiente' },
  linea_origen: DataTypes.STRING(50),
  usuario_validador_id: DataTypes.INTEGER
}, { 
  timestamps: false
});

const LogAlerta = sequelize.define('log_alertas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  lectura_id: DataTypes.INTEGER,
  tipo_alerta: { type: DataTypes.STRING(50), allowNull: false },
  descripcion: DataTypes.TEXT,
  fecha_hora: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  resuelta: { type: DataTypes.BOOLEAN, defaultValue: false },
  resuelta_por: DataTypes.INTEGER,
  fecha_resolucion: DataTypes.DATE
}, { timestamps: false });

const ConfigCamara = sequelize.define('config_camaras', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre_camara: { type: DataTypes.STRING(100), allowNull: false },
  ip: { type: DataTypes.STRING(15), allowNull: false },
  puerto: { type: DataTypes.INTEGER, defaultValue: 23 },
  ubicacion: DataTypes.STRING(200),
  estado: { type: DataTypes.STRING(20), defaultValue: 'activo' },
  parametros: { type: DataTypes.JSONB, defaultValue: {} },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

const SessionLogin = sequelize.define('sessions_login', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  token_jwt: DataTypes.TEXT,
  fecha_inicio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_fin: DataTypes.DATE,
  ip_equipo: DataTypes.STRING(45),
  user_agent: DataTypes.TEXT,
  activa: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: false });

const Configuracion = sequelize.define('configuraciones', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  umbral_confianza: { type: DataTypes.INTEGER, defaultValue: 55 },
  modo_operacion: { type: DataTypes.STRING(20), defaultValue: 'AUTOMATICO' },
  intervalo_lectura: { type: DataTypes.INTEGER, defaultValue: 2000 },
  integracion_sap: { type: DataTypes.BOOLEAN, defaultValue: true },
  auto_alertas_auditoria: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { 
  timestamps: true,
  updatedAt: 'fecha_actualizacion',
  createdAt: false 
});

// Relaciones
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });

// Se eliminó la relación de camara_id con Lectura porque ya no existe en la base de datos
Lectura.belongsTo(Usuario, { foreignKey: 'usuario_validador_id', as: 'validador' });

LogAlerta.belongsTo(Lectura, { foreignKey: 'lectura_id' });
LogAlerta.belongsTo(Usuario, { foreignKey: 'resuelta_por', as: 'resolutor' });

module.exports = {
  sequelize,
  Rol,
  Usuario,
  Lectura,
  LogAlerta,
  ConfigCamara,
  SessionLogin,
  Configuracion
};