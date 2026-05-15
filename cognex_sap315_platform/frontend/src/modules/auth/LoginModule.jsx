import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  Loader2, 
  Mail, 
  Lock, 
  ShieldCheck, 
  UserPlus, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';
import axios from 'axios';

export const LoginModule = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState(''); // 🚀 Doble confirmación
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para alternar entre Login y Configuración Inicial
  const [esUsuarioNuevo, setEsUsuarioNuevo] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');

    // Validación de dominio corporativo en frontend
    if (!email.toLowerCase().endsWith('@softysla.com')) {
      setError('Solo se permiten correos institucionales @softysla.com');
      return;
    }

    // Validación de coincidencia para nuevos accesos
    if (esUsuarioNuevo && password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (esUsuarioNuevo) {
        // 🚀 FASE 2: Configuración de contraseña temporal (Vence en 7 días)
        await axios.post(`${API_URL}/api/v1/usuarios/configurar-password`, {
          email: email.toLowerCase(),
          nueva_contrasena: password,
          confirmar_contrasena: confirmarPassword
        });
        
        setMensajeExito('Acceso configurado. Tu clave temporal es válida por 7 días.');
        setEsUsuarioNuevo(false);
        setPassword('');
        setConfirmarPassword('');
      } else {
        // Intento de inicio de sesión normal
        await login(email, password);
        navigate('/'); 
      }
    } catch (err) {
      /**
       * 🚀 MANEJO DE EXPIRACIÓN (7 DÍAS)
       * Captura el error 403 enviado por el middleware auth.js
       */
      if (err.response?.data?.passwordExpirada) {
        setError('Tu contraseña temporal ha vencido. Contacta al administrador para un reset.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Error de credenciales.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E8FF] flex items-center justify-center p-4 font-hanken">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_18px_44px_rgba(0,0,0,.22)] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Cabecera SAP 315 con colores institucionales */}
        <div className="bg-[#2C0140] p-8 text-center relative">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#0AE8C6] rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3">
              <ShieldCheck className="w-8 h-8 text-[#2C0140]" />
            </div>
            <h1 className="text-2xl font-black text-white font-inter tracking-tight">
              SAP 315 <span className="text-[#0AE8C6] font-normal">Platform</span>
            </h1>
            <p className="text-[#E0B3FF] text-xs mt-2 font-bold uppercase tracking-widest">
              {esUsuarioNuevo ? 'Configuración de Acceso Temporal' : 'Trazabilidad Operacional'}
            </p>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-[11px] font-black rounded-xl text-center uppercase flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {mensajeExito && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {mensajeExito}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#555555] uppercase tracking-widest pl-1">Correo Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4A008B] outline-none transition-all text-sm font-medium"
                  placeholder="usuario@softysla.com" required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-[#555555] uppercase tracking-widest pl-1">
                {esUsuarioNuevo ? 'Nueva Contraseña (Vence en 7 días)' : 'Contraseña'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4A008B] outline-none transition-all text-sm font-medium"
                  placeholder="••••••••" required
                />
              </div>
            </div>

            {esUsuarioNuevo && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-[#555555] uppercase tracking-widest pl-1">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4A008B] outline-none transition-all text-sm font-medium"
                    placeholder="Repite tu contraseña" required
                  />
                </div>
              </div>
            )}

            <button
              type="submit" disabled={isSubmitting}
              className="w-full mt-6 bg-[#4A008B] hover:bg-[#38006B] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                esUsuarioNuevo ? <>Configurar Acceso <UserPlus className="w-4 h-4"/></> : <>Ingresar al Sistema <ArrowRight className="w-4 h-4"/></>}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <button
              type="button" onClick={() => { setEsUsuarioNuevo(!esUsuarioNuevo); setError(''); setMensajeExito(''); }}
              className="text-xs font-bold text-[#7B1FA2] hover:text-[#4A008B] transition-colors"
            >
              {esUsuarioNuevo ? '¿Ya configuraste tu cuenta? Inicia sesión aquí' : '¿Eres usuario nuevo? Activa tu cuenta de 7 días aquí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModule;