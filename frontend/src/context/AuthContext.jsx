import { createContext, useEffect, useState } from "react";
import { loginRequest, registerRequest } from "../api/authApi";

export const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [role, setRole] = useState(() => localStorage.getItem("user_role"));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(token));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(token));
  }, [token]);

  const login = async (credentials) => {
    setLoading(true);

    try {
      const data = await loginRequest(credentials);

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_role", data.rol);

      setToken(data.access_token);
      setRole(data.rol);
      setIsAuthenticated(true);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);

    try {
      const data = await registerRequest(userData);

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_role", data.rol);

      setToken(data.access_token);
      setRole(data.rol);
      setIsAuthenticated(true);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");

    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  const value = {
    token,
    role,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;