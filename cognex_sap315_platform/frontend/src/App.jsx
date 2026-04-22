import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './shared/components/Layout';
import { DashboardModule } from './modules/dashboard/DashboardModule';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardModule />} />
          <Route path="/lecturas" element={<div className="text-gray-500">Módulo de Lecturas - En desarrollo</div>} />
          <Route path="/alertas" element={<div className="text-gray-500">Módulo de Alertas - En desarrollo</div>} />
          <Route path="/configuracion" element={<div className="text-gray-500">Configuración - En desarrollo</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;