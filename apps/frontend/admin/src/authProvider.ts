import { AuthProvider } from 'react-admin';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Auth Provider for React Admin
 *
 * Only allows SUPER_ADMIN role to access the admin panel.
 */
export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const { accessToken, user } = await response.json();

    // Only allow SUPER_ADMIN
    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Acceso denegado. Solo administradores.');
    }

    localStorage.setItem('admin_token', accessToken);
    localStorage.setItem('admin_user', JSON.stringify(user));

    return Promise.resolve();
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return Promise.resolve();
  },

  checkAuth: () => {
    const token = localStorage.getItem('admin_token');
    return token ? Promise.resolve() : Promise.reject();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    const user = localStorage.getItem('admin_user');
    if (!user) {
      return Promise.reject();
    }
    const parsed = JSON.parse(user);
    return Promise.resolve({
      id: parsed.id,
      fullName: parsed.name || parsed.email,
      avatar: parsed.avatar,
    });
  },

  getPermissions: () => {
    const user = localStorage.getItem('admin_user');
    if (!user) {
      return Promise.resolve([]);
    }
    const parsed = JSON.parse(user);
    return Promise.resolve(parsed.role);
  },
};
