import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ScanLine, AlertTriangle, Settings, LogOut } from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/lecturas', icon: ScanLine, label: 'Lecturas' },
  { path: '/alertas', icon: AlertTriangle, label: 'Alertas' },
  { path: '/configuracion', icon: Settings, label: 'Configuración' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-blue-400" />
          COGNEX SAP315
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white w-full">
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};