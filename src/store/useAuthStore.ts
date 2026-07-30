import { create } from 'zustand';

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null, // Ideally fetch user profile with token, or store user stringified in localStorage
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ token, user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ token: null, user: null });
  },
}));

// Helper to initialize auth state correctly if user data is stored in localStorage
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      useAuthStore.setState({ user: JSON.parse(storedUser) });
    } catch (e) {
      console.error('Failed to parse stored user data', e);
    }
  }
}
