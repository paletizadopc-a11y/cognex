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

      // 1. Manejo de expiración de sesión
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('jwt_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      const textData = await response.text();
      let data;

      try {
        data = textData ? JSON.parse(textData) : {};
      } catch (e) {
        console.error("El servidor no devolvió un JSON válido:", textData);
        throw new Error('Error de comunicación con el servidor.');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Ocurrió un error inesperado.');
      }

      return data;
    } catch (error) {
      console.error(`Error en API [${endpoint}]:`, error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('No hay conexión con el servidor. Verifica el backend.');
      }
      throw error;
    }
  },

  // 🚀 MÉTODOS DE CONVENIENCIA ACTUALIZADOS
  get: (endpoint) => api.fetch(endpoint, { method: 'GET' }),
  
  post: (endpoint, body) => api.fetch(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  
  put: (endpoint, body) => api.fetch(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  }),

  patch: (endpoint, body) => api.fetch(endpoint, { 
    method: 'PATCH', 
    body: JSON.stringify(body) 
  }),

  delete: (endpoint) => api.fetch(endpoint, { 
    method: 'DELETE' 
  }),
};