// src/shared/services/api.js

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  async fetch(endpoint, options = {}) {
    const token = localStorage.getItem('jwt_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // 1. Manejo de expiración de sesión (Expulsar si el token caducó)
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('jwt_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // 2. Leer la respuesta como texto PRIMERO para evitar que se rompa
      const textData = await response.text();
      let data;

      try {
        // Intentar convertir ese texto a JSON
        data = textData ? JSON.parse(textData) : {};
      } catch (e) {
        // Si no es JSON (ej. un error 404 en HTML o el servidor caído), capturamos el error
        console.error("El servidor no devolvió un JSON válido:", textData);
        throw new Error('Error de comunicación con el servidor. Por favor, intenta más tarde.');
      }

      // 3. Si la petición falló (Status 400 o 500), lanzamos el error en español
      if (!response.ok) {
        // Usamos el error que mandó Node.js, o un mensaje genérico de respaldo
        throw new Error(data.error || data.message || 'Ocurrió un error inesperado en el sistema.');
      }

      return data;
    } catch (error) {
      console.error(`Error en API [${endpoint}]:`, error);
      
      // 4. Traducción de errores nativos del navegador al español
      if (error.message.includes('Failed to fetch')) {
        throw new Error('No hay conexión con el servidor. Verifica que el backend esté encendido.');
      }
      
      // Lanzamos el error traducido hacia el componente de Login
      throw error;
    }
  },

  // Métodos de conveniencia
  get: (endpoint) => api.fetch(endpoint, { method: 'GET' }),
  post: (endpoint, body) => api.fetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
};