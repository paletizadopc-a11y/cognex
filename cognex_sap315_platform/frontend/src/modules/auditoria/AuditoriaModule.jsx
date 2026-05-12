import React, { useState } from 'react';
import axios from 'axios';
import { 
  Upload, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  FileSearch,
  Loader2,
  ShieldCheck,
  Database,
  History,
  AlertTriangle
} from 'lucide-react';

export const AuditoriaModule = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');
  
  const [confirmando, setConfirmando] = useState(false);
  const [auditoriaCompletada, setAuditoriaCompletada] = useState(false);

  // Configuración de URL dinámica para la API basada en el entorno
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
      setError('Por favor, selecciona un archivo Excel primero.');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
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
      console.error('Error al procesar auditoría:', err);
      setError(err.response?.data?.error || 'Error al procesar el archivo. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🚀 SINCRONIZACIÓN BLINDADA: 
   * Enviamos todos los resultados. El backend filtrará y solo actuará 
   * sobre lo que sea estrictamente necesario (Match Perfecto o Nuevos Errores).
   */
  const confirmarAuditoriaFinal = async () => {
    if (!resultados || resultados.length === 0) return;

    setConfirmando(true);
    setError('');

    try {
      const token = localStorage.getItem('jwt_token');
      
      await axios.post(
        `${API_URL}/api/v1/lecturas/validar-masivo`, 
        { resultados: resultados }, 
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      
      setAuditoriaCompletada(true);
      setResultados([]); // Limpiamos tabla para feedback visual de término
      alert("Sincronización terminada. Se han procesado solo los registros nuevos.");
    } catch (err) {
      console.error('Error en sincronización masiva:', err);
      setError('Error técnico al intentar procesar la validación masiva.');
    } finally {
      setConfirmando(false);
    }
  };

  // 🚀 Lógica de Colores para los 4 Estados de Sincronía
  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'Match Perfecto': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Ya Validado': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'En Alerta': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'No Detectado': return 'bg-red-50 text-red-600 border-red-200';
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
        <p className="text-[#555555]">Cruce inteligente con protección contra duplicidad de datos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CARGA DE ARCHIVO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-soft rounded-2xl p-8 border border-gray-100 text-center h-full flex flex-col justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-[#F3E8FF] rounded-2xl text-[#4A008B]">
                <Upload className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#343A40]">Subir Planificación</h3>
                <p className="text-sm text-[#555555]">Soporta .xlsx y .xls de Softys.</p>
              </div>
              
              <input 
                type="file" 
                accept=".xlsx, .xls, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
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
                {loading ? 'Analizando...' : 'Ejecutar Cruce SAP'}
              </button>
            </div>
            {error && (
              <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium flex items-center gap-2 animate-in shake">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        </div>

        {/* KPIs Y TABLA */}
        <div className="lg:col-span-2 space-y-6">
          
          {resumen && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Total en Archivo</p>
                <p className="text-2xl font-black text-[#343A40]">{resumen.total_excel}</p>
              </div>
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 relative overflow-hidden">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Matches Nuevos</p>
                <p className="text-2xl font-black text-emerald-600">{resumen.pendientes_validar}</p>
                <CheckCircle2 className="absolute -bottom-2 -right-2 w-12 h-12 text-emerald-500 opacity-10" />
              </div>
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Ya Procesados</p>
                <p className="text-2xl font-black text-blue-600">{resumen.ya_procesados}</p>
                <History className="absolute -bottom-2 -right-2 w-12 h-12 text-blue-500 opacity-10" />
              </div>
              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 relative overflow-hidden">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">No Detectados</p>
                <p className="text-2xl font-black text-red-600">{resumen.nuevas_alertas}</p>
                <AlertCircle className="absolute -bottom-2 -right-2 w-12 h-12 text-red-500 opacity-10" />
              </div>
            </div>
          )}

          {resumen && !auditoriaCompletada && (
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#343A40]">Confirmar Acción</h3>
                  <p className="text-xs text-[#555555]">
                    {resumen.pendientes_validar > 0 || resumen.nuevas_alertas > 0 
                      ? `Se actualizarán ${resumen.pendientes_validar} pallets y se generarán ${resumen.nuevas_alertas} alertas nuevas.`
                      : 'Todos los registros de este archivo ya han sido procesados anteriormente.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={confirmarAuditoriaFinal}
                disabled={confirmando || (resumen.pendientes_validar === 0 && resumen.nuevas_alertas === 0)}
                className={`px-8 py-3 font-black rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                  confirmando || (resumen.pendientes_validar === 0 && resumen.nuevas_alertas === 0)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-[#0AE8C6] hover:bg-[#08c7aa] text-[#2C0140]'
                }`}
              >
                {confirmando ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                {confirmando ? 'Sincronizando...' : 'Aprobar y Sincronizar'}
              </button>
            </div>
          )}

          {resultados.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden animate-in slide-in-from-bottom-6">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-[#343A40]">Detalle de Reconciliación LPN</h3>
                <span className="text-[10px] text-gray-400 font-mono">Filtro de Integridad Activo</span>
              </div>
              <div className="overflow-x-auto max-h-[450px] custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
                    <tr className="text-[#555555] text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-4">LPN</th>
                      <th className="px-6 py-4">Estado del Cruce</th>
                      <th className="px-6 py-4">Observación Operativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm font-hanken">
                    {resultados.map((fila, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-[#38006B] tracking-tight">{fila.lpn}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getBadgeStyle(fila.estado)}`}>
                            {fila.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 italic text-xs leading-tight">
                          {fila.detalle}
                        </td>
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