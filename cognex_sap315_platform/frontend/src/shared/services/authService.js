import { api } from './api';

export const authService = {
  login: async (email, password) => {
    // Llama al controlador authController.login del backend
    const data = await api.post('/auth/login', { email, password });
    
    if (data.token) {
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.usuario));
    }
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user_data');
    return user ? JSON.parse(user) : null;
  }
};