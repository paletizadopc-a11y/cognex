import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos el Provider y el Hook de nuestro contexto
import { AuthProvider, useAuth } from './shared/context/AuthContext';

// Importamos los componentes de la interfaz
import { Layout } from './shared/components/Layout';
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { LoginModule } from './modules/auth/LoginModule';

// Importamos los módulos funcionales
import { LecturasModule } from './modules/lecturas/LecturasModule';
import { MonitorModule } from './modules/monitor/MonitorModule';
import { ConfiguracionModule } from './modules/configuracion/ConfiguracionModule';
import { AlertasModule } from './modules/alertas/AlertasModule';

// 🚀 NUEVO: Importamos el módulo de Auditoría
// Asegúrate de que el archivo esté en esta ruta según tu estructura de carpetas
import AuditoriaModule from './modules/auditoria/AuditoriaModule';

// Wrapper para proteger las rutas privadas
const RutaProtegida = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Mientras se valida el token al recargar la página, mostramos un estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F3E8FF]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#555555] font-hanken animate-pulse">Cargando sesión de usuario...</p>
        </div>
      </div>
    );
  }
  
  // Si definitivamente no hay sesión válida, lo enviamos al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizamos el Layout con el Sidebar y el contenido
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// Necesitamos importar Outlet de react-router-dom para que RutaProtegida funcione con Layout
import { Outlet } from 'react-router-dom';

function App() {
  return (
    // Envolvemos todo en el AuthProvider para que el estado global esté disponible
    <AuthProvider>
      <BrowserRouter>
        {/* Contenedor principal con la paleta de colores y tipografía base */}
        <div className="min-h-screen bg-[#F3E8FF] text-[#343A40] font-hanken">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<LoginModule />} />

            {/* Rutas Privadas (Requieren JWT válido) */}
            <Route element={<RutaProtegida />}>
              {/* Al entrar a la raíz "/", carga el dashboard */}
              <Route path="/" element={<DashboardModule />} />
              
              {/* Ruta conectada al módulo de Lecturas */}
              <Route path="/lecturas" element={<LecturasModule />} />

              {/* Ruta conectada al Monitor en Vivo */}
              <Route path="/monitor" element={<MonitorModule />} />
              
              {/* 🚀 NUEVA RUTA: Módulo de Auditoría de Carga */}
              <Route path="/auditoria" element={<AuditoriaModule />} />
              
              {/* Ruta conectada al módulo de Alertas */}
              <Route path="/alertas" element={<AlertasModule />} />

              {/* Ruta conectada al módulo de Configuración */}
              <Route path="/configuracion" element={<ConfiguracionModule />} />
            </Route>
            
            {/* Ruta de captura (404) - Si el usuario inventa una URL, lo mandamos al inicio */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;