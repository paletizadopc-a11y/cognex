import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';

export const LoginModule = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/'); // Redirigir al Dashboard tras éxito
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E8FF] flex items-center justify-center p-4 font-hanken">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-industrial p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="font-inter font-bold text-3xl text-[#4A008B] mb-2">Cognex SAP 315</h1>
          <p className="text-[#555555]">Plataforma de Trazabilidad Operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#343A40] mb-2 uppercase tracking-wider font-inter">
              Correo Institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4A008B] outline-none transition-all"
              placeholder="usuario@softysla.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#343A40] mb-2 uppercase tracking-wider font-inter">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4A008B] outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#4A008B] hover:bg-[#38006B] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-soft"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[#555555]">
          Sistema exclusivo para control de calidad y trazabilidad SAP 315.
        </p>
      </div>
    </div>
  );
};