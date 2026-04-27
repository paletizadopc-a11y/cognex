import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Importamos el Provider y el Hook de nuestro contexto
import { AuthProvider, useAuth } from './shared/context/AuthContext';

// Importamos los componentes de la interfaz
import { Layout } from './shared/components/Layout';
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { LoginModule } from './modules/auth/LoginModule';

// Importamos el nuevo módulo de Historial de Lecturas
import { LecturasModule } from './modules/lecturas/LecturasModule';

// Wrapper para proteger las rutas privadas
const RutaProtegida = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Mientras se valida el token al recargar la página, mostramos un estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F3E8FF]">
        <p className="text-[#555555] font-hanken animate-pulse">Cargando sesión de usuario...</p>
      </div>
    );
  }
  
  // Si definitivamente no hay sesión válida, lo enviamos al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si todo está correcto, renderizamos el Layout con su barra lateral y cabecera
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    // Envolvemos toda la aplicación en el AuthProvider para que el estado global esté disponible
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
              
              {/* Nueva ruta real conectada al módulo de Lecturas */}
              <Route path="/lecturas" element={<LecturasModule />} />
              
              <Route path="/alertas" element={
                <div className="p-6 text-[#555555]">
                  <h2 className="font-inter font-bold text-xl mb-4 text-[#4A008B]">Módulo de Alertas</h2>
                  <p>En desarrollo</p>
                </div>
              } />
              
              <Route path="/configuracion" element={
                <div className="p-6 text-[#555555]">
                  <h2 className="font-inter font-bold text-xl mb-4 text-[#4A008B]">Configuración del Sistema</h2>
                  <p>En desarrollo</p>
                </div>
              } />
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