import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🚀 UNIFICACIÓN DE ESTADO: Usamos 'usuario' para sincronizar con la cabecera y el sidebar
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * 🔄 HIDRATACIÓN DE SESIÓN:
   * Al recargar con F5, recupera el perfil del almacenamiento seguro a través del servicio.
   */
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUsuario(storedUser);
      
      // Sincroniza el token en los encabezados de Axios si existe de forma persistente
      const token = localStorage.getItem('sap315_token') || storedUser.token;
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
    setLoading(false);
  }, []);

  /**
   * 🚪 INICIO DE SESIÓN
   */
  const login = async (email, password) => {
    try {
      // Delegamos la petición HTTP al servicio (evitando URLs en duro aquí)
      const data = await authService.login(email, password);
      
      // Esperamos la estructura: { token, usuario: { id, nombre, email, rol } }
      if (data && data.usuario) {
        setUsuario(data.usuario);
        
        // Si el servicio expone el token, configuramos Axios de inmediato
        if (data.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          localStorage.setItem('sap315_token', data.token);
        }
      }
      return data;
    } catch (error) {
      // Propaga el error para que LoginModule maneje contraseñas expiradas (403)
      throw error;
    }
  };

  /**
   * 🔒 CIERRE DE SESIÓN
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error detectado en la limpieza del servicio de auth:", error);
    } finally {
      // Forzar limpieza del estado local independientemente del resultado del backend
      setUsuario(null);
      localStorage.removeItem('sap315_token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        usuario,                  
        user: usuario,           
        login, 
        logout, 
        loading, 
        isAuthenticated: !!usuario 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);