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

const Lectura = sequelize.define('lecturas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_etiqueta: { type: DataTypes.STRING(255), allowNull: false },
  lpn: { type: DataTypes.STRING(100), allowNull: true },
  fecha_hora: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado_sap: { type: DataTypes.STRING(20), defaultValue: 'pendiente' },
  linea_origen: DataTypes.STRING(50),
  camara_id: DataTypes.INTEGER,
  resultado: DataTypes.JSONB,
  confianza: DataTypes.DECIMAL(5, 2),
  observacion: DataTypes.TEXT,
  metadata_lectura: { type: DataTypes.JSONB, defaultValue: {} }
}, { timestamps: false });

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

// Relaciones
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });

Lectura.belongsTo(ConfigCamara, { foreignKey: 'camara_id' });
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
  SessionLogin
};