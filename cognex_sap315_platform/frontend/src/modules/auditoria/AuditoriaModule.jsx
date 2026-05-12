import React, { useState } from 'react';
import axios from 'axios';
import { 
  Upload, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Ghost, 
  FileSearch,
  Loader2,
  ShieldCheck,
  Database
} from 'lucide-react';

export const AuditoriaModule = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');
  
  const [confirmando, setConfirmando] = useState(false);
  const [auditoriaCompletada, setAuditoriaCompletada] = useState(false);

  // Configuración de URL dinámica para la API
  const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setResultados([]);
    setResumen(null);
    setAuditoriaCompletada(false);
  };

  const procesarAuditoria = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo Excel (.xlsx) primero.');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    // 🚀 Usamos el nombre 'archivo_excel' que espera el backend (multer)
    formData.append('archivo_excel', file); 

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await axios.post(
        `${API_URL}/api/v1/lecturas/comparar-excel`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );

      setResumen(response.data.resumen);
      setResultados(response.data.resultados);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar el archivo. Verifica el formato del Excel o la conexión.');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 FUNCIÓN FINAL: Cambia el estado de los LPNs en la Base de Datos
  const confirmarAuditoriaFinal = async () => {
    if (!resultados || resultados.length === 0) return;

    setConfirmando(true);
    setError('');

    try {
      const token = localStorage.getItem('jwt_token');
      
      // Filtramos solo los LPNs que hicieron 'Match Perfecto' para validarlos
      const lpnsAValidar = resultados
        .filter(r => r.estado === 'Match Perfecto')
        .map(r => r.lpn);

      if (lpnsAValidar.length === 0) {
        setError('No hay LPNs con Match Perfecto para validar.');
        setConfirmando(false);
        return;
      }

      // Llamada al endpoint de validación masiva en el Backend
      await axios.post(
        `${API_URL}/api/v1/lecturas/validar-masivo`, 
        { lpns: lpnsAValidar },
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      setAuditoriaCompletada(true);
      // Opcional: Feedback visual de éxito
      alert(`${lpnsAValidar.length} LPNs validados correctamente en SAP 315.`);
    } catch (err) {
      console.error(err);
      setError('Error técnico al intentar actualizar la base de datos.');
    } finally {
      setConfirmando(false);
    }
  };

  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'Match Perfecto': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Faltante (Miss)': return 'bg-red-50 text-red-600 border-red-200';
      case 'Extra (Ghost)': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="p-8 font-hanken animate-in fade-in">
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8 text-[#4A008B]" />
          <h1 className="font-inter font-bold text-3xl text-[#343A40]">Auditoría de Carga (Reconciliación)</h1>
        </div>
        <p className="text-[#555555]">Cruce inteligente entre la planificación de Softys y las lecturas de la Pistola RF.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: ZONA DE CARGA */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-soft rounded-2xl p-8 border border-gray-100 text-center h-full flex flex-col justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-[#F3E8FF] rounded-2xl text-[#4A008B]">
                <Upload className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#343A40]">Subir Planificación</h3>
                <p className="text-sm text-[#555555]">Sube el archivo Excel (.xlsx) entregado por Softys.</p>
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
                className={`cursor-pointer w-full px-6 py-3 rounded-xl border-2 transition-all font-bold text-sm ${
                  file 
                  ? 'border-[#0AE8C6] bg-[#0AE8C6]/10 text-[#2C0140]' 
                  : 'border-gray-200 hover:border-[#4A008B] hover:bg-gray-50 text-[#555555]'
                }`}
              >
                {file ? <span className="flex items-center justify-center gap-2"><FileCheck className="w-4 h-4"/> {file.name}</span> : 'Seleccionar Archivo Excel'}
              </label>

              <button 
                onClick={procesarAuditoria}
                disabled={loading || !file}
                className={`w-full py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                  loading || !file 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#4A008B] hover:bg-[#38006B] text-white shadow-[#4A008B]/20'
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSearch className="w-5 h-5" />}
                {loading ? 'Cruzando Datos...' : 'Ejecutar Cruce SAP'}
              </button>
            </div>
            {error && (
              <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: RESULTADOS Y KPIS */}
        <div className="lg:col-span-2 space-y-6">
          
          {resumen && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Database className="w-3 h-3"/> Total Excel</p>
                <p className="text-3xl font-black text-[#343A40]">{resumen.total_excel}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-soft relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><CheckCircle2 className="w-12 h-12 text-emerald-500"/></div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Match Perfecto</p>
                <p className="text-3xl font-black text-emerald-600">{resumen.match_perfecto}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-soft relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><AlertCircle className="w-12 h-12 text-red-500"/></div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Faltantes</p>
                <p className="text-3xl font-black text-red-500">{resumen.faltantes}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-soft relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10"><Ghost className="w-12 h-12 text-amber-500"/></div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Extras (Ghost)</p>
                <p className="text-3xl font-black text-amber-600">{resumen.extras}</p>
              </div>
            </div>
          )}

          {resumen && (
            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all shadow-soft
              ${auditoriaCompletada ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}
            >
              <div className="flex-1">
                <h3 className="font-bold text-[#343A40] text-lg">
                  {auditoriaCompletada ? '¡Base de Datos Actualizada!' : 'Confirmar Sincronización SAP'}
                </h3>
                <p className="text-sm text-[#555555]">
                  {auditoriaCompletada 
                    ? 'Los pallets han sido marcados oficialmente como validados.' 
                    : `Se actualizarán ${resumen.match_perfecto} pallets de "Pendiente" a "OK".`}
                </p>
              </div>
              {!auditoriaCompletada && (
                <button 
                  onClick={confirmarAuditoriaFinal}
                  disabled={confirmando}
                  className="shrink-0 px-6 py-3 bg-[#0AE8C6] hover:bg-[#08c7aa] text-[#2C0140] font-black rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {confirmando ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {confirmando ? 'Validando...' : 'Aprobar y Sincronizar'}
                </button>
              )}
            </div>
          )}

          {resultados.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden animate-in slide-in-from-bottom-6">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-[#343A40]">Detalle de Reconciliación LPN</h3>
              </div>
              <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="text-[#555555] text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                      <th className="px-6 py-4">LPN</th>
                      <th className="px-6 py-4">Orden</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {resultados.map((fila, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#38006B]">{fila.lpn}</td>
                        <td className="px-6 py-4 text-gray-500 font-mono">{fila.orden}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getBadgeStyle(fila.estado)}`}>
                            {fila.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 italic text-xs">{fila.detalle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default AuditoriaModule;