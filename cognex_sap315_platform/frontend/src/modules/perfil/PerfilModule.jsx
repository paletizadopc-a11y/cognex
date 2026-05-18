import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { 
  User, 
  Lock, 
  ShieldCheck, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  KeyRound, 
  Clock,
  BadgeCheck,
  IdCard,
  Building2
} from 'lucide-react';
import { api } from '../../shared/services/api';

export const PerfilModule = () => {
  // 🚀 Compatibilidad doble: extrae de forma segura tanto 'usuario' como 'user'
  const { usuario, user } = useAuth();
  const datosUsuario = usuario || user;

  // Estados locales para el formulario de claves
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  
  // Estados de control operacional
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Extrae dinámicamente las iniciales para el anillo del avatar
  const obtenerIniciales = (nombre) => {
    if (!nombre) return 'US';
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (nuevaPassword !== confirmarPassword) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (nuevaPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres por seguridad.');
      return;
    }

    setLoading(true);

    try {
      // Petición al endpoint verificado del backend
      const response = await api.post('/usuarios/cambiar-password-definitiva', {
        email: datosUsuario?.email,
        password_actual: passwordActual,
        nueva_password: nuevaPassword
      });

      setSuccess('¡Contraseña actualizada con éxito! Tu acceso ahora es permanente.');
      
      setPasswordActual('');
      setNuevaPassword('');
      setConfirmarPassword('');

      /**
       * 🔄 SINCRONIZACIÓN EN CALIENTE:
       * Guardamos el objeto actualizado enviado por el backend y refrescamos la sesión
       * para remover en tiempo real los avisos residuales de la cabecera.
       */
      const usuarioActualizado = response.data?.usuario || response.usuario;
      if (usuarioActualizado) {
        localStorage.setItem('sap315_usuario', JSON.stringify(usuarioActualizado));
      } else {
        const usuarioLocal = JSON.parse(localStorage.getItem('sap315_usuario') || '{}');
        usuarioLocal.es_password_temporal = false;
        usuarioLocal.password_expires_at = null;
        localStorage.setItem('sap315_usuario', JSON.stringify(usuarioLocal));
      }

      // Pequeño delay de cortesía antes de rehidratar el Layout de la app
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      // Mapeo tolerante a errores estructurados tanto en formato .message como .error
      const mensajeError = err.response?.data?.message || err.response?.data?.error || 'Error al intentar actualizar la contraseña. Verifica tu clave actual.';
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 font-hanken max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* Título de la Sección */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
            <User className="w-6 h-6 text-[#4A008B]" />
          </div>
          <h1 className="font-inter font-bold text-3xl text-[#343A40] tracking-tight">Mi Perfil de Usuario</h1>
        </div>
        <p className="text-[#555555] text-sm">Visualiza la información oficial de tu cuenta corporativa y gestiona tus credenciales personales de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ==================================================================== */}
        {/* PANEL IZQUIERDO: BLOQUES ESTRUCTURADOS DE INFORMACIÓN */}
        {/* ==================================================================== */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          
          {/* Encabezado del Perfil con Avatar de Identidad */}
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-gray-100 pb-8 mb-8">
            <div className="w-24 h-24 bg-gradient-to-tr from-[#4A008B] to-[#7B1FA2] text-white font-black text-3xl rounded-full flex items-center justify-center shadow-lg shadow-purple-900/10 ring-4 ring-[#F3E8FF] shrink-0">
              {obtenerIniciales(datosUsuario?.nombre)}
            </div>
            <div className="text-center sm:text-left min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1.5">
                <h2 className="font-inter font-bold text-2xl text-[#343A40] tracking-tight truncate">{datosUsuario?.nombre || 'Usuario SAP 315'}</h2>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Sincronizado
                </span>
              </div>
              <p className="text-[#555555] text-sm font-medium mb-3">{datosUsuario?.email || 'sin-correo@softysla.com'}</p>
              
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="bg-purple-50 text-[#4A008B] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border border-purple-100/50">
                  Perfil de Lectura
                </span>
              </div>
            </div>
          </div>

          {/* Grilla Organizada de Datos del Usuario */}
          <h3 className="text-xs font-black text-[#4A008B] uppercase tracking-widest mb-4">Información Institucional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Campo: Nombre Completo */}
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Nombre Registrado</p>
                <p className="text-sm font-bold text-[#343A40]">{datosUsuario?.nombre || 'No Especificado'}</p>
              </div>
            </div>

            {/* Campo: Correo Electrónico */}
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl flex items-start gap-3">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Correo Corporativo</p>
                <p className="text-sm font-bold text-[#343A40] truncate">{datosUsuario?.email || 'No Especificado'}</p>
              </div>
            </div>

            {/* Campo: Identificador único de Cuenta */}
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl flex items-start gap-3">
              <IdCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">ID de Sistema</p>
                <p className="text-sm font-mono font-bold text-[#343A40]">USR-000{datosUsuario?.id || 'N/A'}</p>
              </div>
            </div>

            {/* Campo: Empresa / Planta */}
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl flex items-start gap-3">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Planta / Empresa</p>
                <p className="text-sm font-bold text-[#343A40]">Softys S.A. Chile</p>
              </div>
            </div>

            {/* Campo: Nivel de Privilegios */}
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#7B1FA2] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Nivel de Privilegios</p>
                <p className="text-sm font-bold text-purple-800 uppercase tracking-wide">
                  {datosUsuario?.rol?.nombre_rol || datosUsuario?.rol || 'Operador'}
                </p>
              </div>
            </div>

            {/* Campo: Estado Operacional */}
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-2xl flex items-start gap-3">
              <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Estado Operacional</p>
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-wide">Activo y Autorizado</p>
              </div>
            </div>

          </div>
        </div>

        {/* ==================================================================== */}
        {/* PANEL DERECHO: FORMULARIO SEGURO DE ACTUALIZACIÓN DE CONTRASEÑA */}
        {/* ==================================================================== */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2.5 mb-6 border-b border-gray-50 pb-4">
              <KeyRound className="w-5 h-5 text-[#7B1FA2]" />
              <h3 className="font-inter font-bold text-lg text-[#343A40]">Actualizar Contraseña</h3>
            </div>

            {/* Bloques de Alertas Operacionales */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-xl flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold rounded-xl flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            {/* Banner Informativo sobre Políticas de Claves Temporales */}
            {datosUsuario?.es_password_temporal && (
              <div className="mb-5 p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl flex gap-2.5 items-start">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  <span className="font-black uppercase block mb-0.5">Medida de Seguridad Activa</span>
                  Posees una clave temporal con vigencia de 7 días. Actualízala ahora para volver tu acceso permanente.
                </div>
              </div>
            )}

            <form onSubmit={handleCambiarPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#555555] uppercase tracking-widest pl-1">Contraseña Actual</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4A008B] outline-none transition-all text-sm font-medium"
                    placeholder="Introduce tu clave actual" required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#555555] uppercase tracking-widest pl-1">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4A008B] outline-none transition-all text-sm font-medium"
                    placeholder="Mínimo 6 caracteres" required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#555555] uppercase tracking-widest pl-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4A008B] outline-none transition-all text-sm font-medium"
                    placeholder="Repite la nueva clave" required
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full mt-4 bg-[#4A008B] hover:bg-[#38006B] text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios Definitivos'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerfilModule;