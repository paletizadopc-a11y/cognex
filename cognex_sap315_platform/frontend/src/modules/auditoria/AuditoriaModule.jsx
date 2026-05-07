import React, { useState } from 'react';
import axios from 'axios';
import { 
  Upload, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Ghost, 
  FileSearch,
  Loader2
} from 'lucide-react';

const AuditoriaModule = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const procesarAuditoria = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo Excel (.xlsx) primero.');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('archivo_excel', file);

    try {
      const token = localStorage.getItem('token');
      // Asegúrate de que la URL coincida con tu backend
      const response = await axios.post(
        'http://localhost:3000/api/v1/lecturas/comparar-excel', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setResumen(response.data.resumen);
      setResultados(response.data.resultados);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar el archivo. Verifica el formato del Excel.');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'Match Perfecto': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Faltante (Miss)': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Extra (Ghost)': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white font-interTight">Auditoría de Reconciliación</h1>
        <p className="text-white/60">Cruce de información entre planificación Softys y lecturas SAP315</p>
      </div>

      {/* Zona de Carga */}
      <div className="bg-header-footer shadow-soft rounded-2xl p-8 border border-white/5 text-center">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white/5 rounded-full text-accent">
              <Upload className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Subir Planificación</h3>
              <p className="text-sm text-white/40">Arrastra o selecciona el archivo Excel (.xlsx) entregado por Softys</p>
            </div>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange}
              id="excel-upload"
              className="hidden"
            />
            
            <label 
              htmlFor="excel-upload"
              className="cursor-pointer px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all"
            >
              {file ? file.name : 'Seleccionar Archivo'}
            </label>

            <button 
              onClick={procesarAuditoria}
              disabled={loading || !file}
              className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading || !file 
                ? 'bg-gray-700 text-white/30 cursor-not-allowed' 
                : 'bg-primary hover:bg-hover-dark-purple text-white'
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSearch className="w-5 h-5" />}
              {loading ? 'Procesando Datos...' : 'Ejecutar Auditoría'}
            </button>
          </div>
          {error && <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>}
        </div>
      </div>

      {/* Resumen KPIs */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-header-footer p-5 rounded-2xl border border-white/5 shadow-soft">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Total Excel</p>
            <p className="text-3xl font-bold text-white">{resumen.total_excel}</p>
          </div>
          <div className="bg-header-footer p-5 rounded-2xl border border-white/5 shadow-soft">
            <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">Match Perfecto</p>
            <p className="text-3xl font-bold text-white">{resumen.match_perfecto}</p>
          </div>
          <div className="bg-header-footer p-5 rounded-2xl border border-white/5 shadow-soft">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Faltantes</p>
            <p className="text-3xl font-bold text-white">{resumen.faltantes}</p>
          </div>
          <div className="bg-header-footer p-5 rounded-2xl border border-white/5 shadow-soft">
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Extras (Ghost)</p>
            <p className="text-3xl font-bold text-white">{resumen.extras}</p>
          </div>
        </div>
      )}

      {/* Detalle de Auditoría */}
      {resultados.length > 0 && (
        <div className="bg-header-footer rounded-2xl border border-white/5 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-white">Detalle de Reconciliación</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/20 text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">LPN</th>
                  <th className="px-6 py-4 font-medium">Orden</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {resultados.map((fila, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{fila.lpn}</td>
                    <td className="px-6 py-4 text-white/60">{fila.orden}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getBadgeColor(fila.estado)}`}>
                        {fila.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/40 italic">{fila.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditoriaModule;