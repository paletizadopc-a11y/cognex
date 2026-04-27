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

// 🚀 MODELO LECTURA ACTUALIZADO CON LPN
const Lectura = sequelize.define('lecturas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_etiqueta: { type: DataTypes.STRING(255), allowNull: false },
  lpn: { type: DataTypes.STRING(100), allowNull: true },
  fecha_hora: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  estado_sap: { type: DataTypes.STRING(20), defaultValue: 'pendiente' },
  linea_origen: DataTypes.STRING(50),
  resultado: DataTypes.STRING(50),
  confianza: DataTypes.DECIMAL(5, 2),
  metadata_lectura: { type: DataTypes.JSONB, defaultValue: {} }
}, { timestamps: true, createdAt: 'created_at', updatedAt: false });

const LogAlerta = sequelize.define('logs_alertas', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo_alerta: { type: DataTypes.STRING(50), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  severidad: { type: DataTypes.STRING(20), defaultValue: 'media' },
  resuelta: { type: DataTypes.BOOLEAN, defaultValue: false },
  fecha_resolucion: DataTypes.DATE
}, { timestamps: false });

const EvidenciaImagen = sequelize.define('evidencias_imagenes', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ruta_archivo: { type: DataTypes.STRING(500), allowNull: false },
  nombre_archivo: DataTypes.STRING(255),
  tamano_bytes: DataTypes.INTEGER,
  formato: DataTypes.STRING(10),
  fecha_captura: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  observacion: DataTypes.TEXT,
  hash_sha256: DataTypes.STRING(64)
}, { timestamps: false });

const ConfigCamara = sequelize.define('configuracion_camaras', {
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
LogAlerta.belongsTo(Usuario, { foreignKey: 'resuelta_por' });

EvidenciaImagen.belongsTo(Lectura, { foreignKey: 'lectura_id' });

SessionLogin.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = {
  sequelize,
  Rol,
  Usuario,
  Lectura,
  LogAlerta,
  EvidenciaImagen,
  ConfigCamara,
  SessionLogin
};