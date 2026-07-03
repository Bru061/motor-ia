import { useEffect, useState } from "react";
import { loginRequest, registerRequest } from "../api/authApi";
import { AuthContext } from "./authContext";

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [role, setRole] = useState(() => localStorage.getItem("user_role"));
  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    const clearUnauthorizedSession = () => {
      setToken(null);
      setRole(null);
    };

    window.addEventListener("auth:unauthorized", clearUnauthorizedSession);

    return () => {
      window.removeEventListener("auth:unauthorized", clearUnauthorizedSession);
    };
  }, []);

  const saveSession = (data) => {
    const accessToken = data.access_token;
    const userRole = data.rol || data.role || "estudiante";

    if (!accessToken) {
      throw new Error("La respuesta de autenticación no incluye access_token.");
    }

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user_role", userRole);

    setToken(accessToken);
    setRole(userRole);
  };

  const login = async (credentials) => {
    setLoading(true);

    try {
      const data = await loginRequest(credentials);

      saveSession(data);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);

    try {
      const data = await registerRequest(userData);

      saveSession(data);

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
