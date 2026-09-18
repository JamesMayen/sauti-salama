import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearAuthSession,
  getCurrentUser,
  getStoredToken,
  getStoredUser,
  loginUser,
  registerUser,
} from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = Boolean(user && getStoredToken());

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const token = getStoredToken();

      if (!token) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getCurrentUser();

        if (mounted) {
          const currentUser = response?.data?.user;

          if (currentUser) {
            setUser(currentUser);
          } else {
            clearAuthSession();
            setUser(null);
          }
        }
      } catch (err) {
        if (mounted) {
          clearAuthSession();
          setUser(null);
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function login(credentials) {
    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(credentials);
      const loggedInUser = response?.data?.user;

      setUser(loggedInUser || null);

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(credentials) {
    setLoading(true);
    setError(null);

    try {
      const response = await registerUser(credentials);
      const registeredUser = response?.data?.user;

      setUser(registeredUser || null);

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAuthSession();
    setUser(null);
    setError(null);
  }

  async function refreshUser() {
    try {
      const response = await getCurrentUser();
      const currentUser = response?.data?.user;

      if (currentUser) {
        setUser(currentUser);
      }

      return response;
    } catch (err) {
      clearAuthSession();
      setUser(null);
      setError(err.message);
      throw err;
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, error, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside an AuthProvider."
    );
  }

  return context;
}