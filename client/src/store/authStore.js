import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          return { success: true, user };
        } catch (error) {
          set({ isLoading: false });
          throw error.response?.data?.message || 'Login failed';
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', data);
          const { user, token } = response.data.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          return { success: true, user };
        } catch (error) {
          set({ isLoading: false });
          throw error.response?.data?.message || 'Registration failed';
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.data, isAuthenticated: true });
          return true;
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          delete api.defaults.headers.common['Authorization'];
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
