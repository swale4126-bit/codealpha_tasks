import { useCallback, useEffect, useMemo, useState } from 'react';
import { TOKEN_STORAGE_KEY } from '../services/api.js';
import { getMeRequest, loginRequest, registerRequest } from '../services/authService.js';
import { AuthContext } from './contexts.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const profile = await getMeRequest();
      setUser(profile);
      return profile;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token, refreshUser]);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener('koramarket:unauthorized', onUnauthorized);
    return () => window.removeEventListener('koramarket:unauthorized', onUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token: jwt } = await loginRequest(credentials);
    localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
    setToken(jwt);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: newUser, token: jwt } = await registerRequest(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
    setToken(jwt);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
