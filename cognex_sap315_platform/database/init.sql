CREATE DATABASE cognex_sap315_db;
\c cognex_sap315_db;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (nombre_rol, descripcion) VALUES
    ('admin', 'Administrador del sistema'),
    ('supervisor', 'Supervisor de linea'),
    ('operador', 'Operador de camara'),
    ('auditor', 'Auditor - solo lectura');

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    activo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE configuracion_camaras (
    id SERIAL PRIMARY KEY,
    nombre_camara VARCHAR(100) NOT NULL,
    ip VARCHAR(15) NOT NULL,
    puerto INTEGER DEFAULT 23,
    ubicacion VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'activo',
    parametros JSONB DEFAULT '{}',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lecturas (
    id SERIAL PRIMARY KEY,
    codigo_etiqueta VARCHAR(255) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_sap VARCHAR(20) DEFAULT 'pendiente',
    linea_origen VARCHAR(50),
    camara_id INTEGER REFERENCES configuracion_camaras(id),
    resultado VARCHAR(50),
    confianza DECIMAL(5,2),
    usuario_validador_id INTEGER REFERENCES usuarios(id),
    metadata_lectura JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs_alertas (
    id SERIAL PRIMARY KEY,
    tipo_alerta VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    lectura_id INTEGER REFERENCES lecturas(id) ON DELETE SET NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severidad VARCHAR(20) DEFAULT 'media',
    resuelta BOOLEAN DEFAULT false,
    resuelta_por INTEGER REFERENCES usuarios(id),
    fecha_resolucion TIMESTAMP
);

CREATE TABLE evidencias_imagenes (
    id SERIAL PRIMARY KEY,
    lectura_id INTEGER NOT NULL REFERENCES lecturas(id) ON DELETE CASCADE,
    ruta_archivo VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(255),
    tamano_bytes INTEGER,
    formato VARCHAR(10),
    fecha_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    hash_sha256 VARCHAR(64)
);

CREATE TABLE sessions_login (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_jwt TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    ip_equipo VARCHAR(45),
    user_agent TEXT,
    activa BOOLEAN DEFAULT true
);