import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Importamos el Provider y el Hook de nuestro contexto global de autenticación
import { AuthProvider, useAuth } from './shared/context/AuthContext';

// Importamos los componentes compartidos de estructura (Layout)
import { Layout } from './shared/components/Layout';

// Importamos los módulos funcionales de la plataforma SAP 315
import { LoginModule } from './modules/auth/LoginModule';
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { LecturasModule } from './modules/lecturas/LecturasModule';
import { MonitorModule } from './modules/monitor/MonitorModule';
import { AlertasModule } from './modules/alertas/AlertasModule';
import { ConfiguracionModule } from './modules/configuracion/ConfiguracionModule';

// Módulo de Auditoría de Carga (Reconciliación inteligente)
import AuditoriaModule from './modules/auditoria/AuditoriaModule';

// Módulo exclusivo de Perfil de Usuario Separado
import { PerfilModule } from './modules/perfil/PerfilModule';

// 🚀 NUEVO IMPORT: Panel de Logs de Auditoría para traza de operadores
import { LogsModule } from './modules/logs/LogsModule';

/**
 * 🔒 WRAPPER DE SEGURIDAD: RutaProtegida
 * Valida la existencia de una sesión en tiempo real. Si el token expira o la contraseña
 * temporal de 7 días se vence, redirige automáticamente al login.
 */
const RutaProtegida = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Mientras se valida el token en el almacenamiento local al refrescar, mostramos un loader corporativo
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F3E8FF]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4A008B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#555555] font-hanken font-bold animate-pulse text-sm uppercase tracking-wider">
            Sincronizando seguridad SAP 315...
          </p>
        </div>
      </div>
    );
  }
  
  // Si no hay una sesión activa, denegamos el paso y redirigimos al Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /**
   * Si está autenticado, renderizamos el cascarón común (Layout).
   * El componente <Outlet /> inyectará dinámicamente la vista según la ruta seleccionada.
   */
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    // Envolvemos toda la aplicación en el proveedor de autenticación global
    <AuthProvider>
      <BrowserRouter>
        {/* Contenedor maestro con la paleta púrpura y tipografía corporativa de Softys */}
        <div className="min-h-screen bg-[#F3E8FF] text-[#343A40] font-hanken antialiased">
          <Routes>
            {/* 🚪 RUTA PÚBLICA: Autenticación e Invitaciones */}
            <Route path="/login" element={<LoginModule />} />

            {/* 🔒 RUTAS PRIVADAS: Resguardadas bajo el middleware de React */}
            <Route element={<RutaProtegida />}>
              {/* Panel de Control Principal (KPIs Operacionales) */}
              <Route path="/" element={<DashboardModule />} />
              
              {/* Historial de Trazabilidad de Pallets (LPNs) */}
              <Route path="/lecturas" element={<LecturasModule />} />

              {/* Streaming en vivo y estado físico del Proxy de la Cámara Cognex */}
              <Route path="/monitor" element={<MonitorModule />} />
              
              {/* Conciliación Inteligente mediante Carga de Planificación Excel */}
              <Route path="/auditoria" element={<AuditoriaModule />} />
              
              {/* Centro de Incidencias, Alertas Críticas y Borrado de Historial */}
              <Route path="/alertas" element={<AlertasModule />} />

              {/* Espacio Privado del Operador (Cambio de clave de 7 días y datos personales) */}
              <Route path="/perfil" element={<PerfilModule />} />

              {/* 🚀 NUEVA RUTA PRIVADA: Panel Histórico de Logs de Auditoría */}
              <Route path="/logs" element={<LogsModule />} />

              {/* Gestión Administrativa de Roles, Usuarios y Parámetros del Sistema */}
              <Route path="/configuracion" element={<ConfiguracionModule />} />
            </Route>
            
            {/* 🔄 CAPTURA GLOBAL DE ERRORES (404): Redirección preventiva */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;