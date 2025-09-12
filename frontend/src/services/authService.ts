// src/services/authService.ts

import { apiClient } from './apiClient';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    // Esta función debería implementarse en el backend
    // Por ahora, decodificaremos el token del localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || payload.email,
        role: payload.role
      };
    } catch {
      throw new Error('Invalid token');
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  }
};