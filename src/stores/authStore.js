import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const getSavedUser = () => {
    try {
      const saved = localStorage.getItem('tass_user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  const getSavedToken = () => {
    try {
      return localStorage.getItem('tass_token') || '';
    } catch {
      return '';
    }
  };

  const user = ref(getSavedUser());
  const token = ref(getSavedToken());
  const API_URL = 'http://localhost:5176';

  const isAuthenticated = computed(() => !!token.value);

  // Helper centralizado para requisições HTTP com Token JWT
  const request = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401 || response.status === 403) {
        // Sessão expirada ou token corrompido, força logout
        logout();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('tass_token', data.token);
      localStorage.setItem('tass_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (googleAccessToken) => {
    try {
      const data = await request('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ accessToken: googleAccessToken })
      });

      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('tass_token', data.token);
      localStorage.setItem('tass_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      token.value = data.token;
      user.value = data.user;
      localStorage.setItem('tass_token', data.token);
      localStorage.setItem('tass_user', JSON.stringify(data.user));
      return data; // Inclui o recoveryCode
    } catch (error) {
      throw error;
    }
  };

  const recoverPassword = async (email, recoveryCode, newPassword) => {
    try {
      return await request('/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ email, recoveryCode, newPassword })
      });
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      return await request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    } catch (error) {
      throw error;
    }
  };

  const getRecoveryCode = async () => {
    try {
      const data = await request('/api/auth/recovery-code', {
        method: 'GET'
      });
      return data.recoveryCode;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    token.value = '';
    user.value = null;
    localStorage.removeItem('tass_token');
    localStorage.removeItem('tass_user');
  };

  return {
    user,
    token,
    API_URL,
    isAuthenticated,
    request,
    login,
    loginWithGoogle,
    register,
    recoverPassword,
    changePassword,
    getRecoveryCode,
    logout
  };
});
