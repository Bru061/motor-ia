import { useEffect, useState } from "react";
import {
  iniciarSesion,
  registrarUsuario,
  autenticarConGoogle,
  solicitarRecuperacionPassword,
  restablecerPassword,
} from "../api/authApi";
import { AuthContext } from "./authContext";

function decodeJwtPayload(token) {
  if (!token) {
    return {};
  }

  try {
    const [, payload] = token.split(".");
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = decodeURIComponent(
      window
        .atob(normalizedPayload)
        .split("")
        .map((character) => {
          const hex = character.charCodeAt(0).toString(16).padStart(2, "0");
          return `%${hex}`;
        })
        .join(""),
    );

    return JSON.parse(decodedPayload);
  } catch {
    return {};
  }
}

function buildUser(data, fallback = {}) {
  const tokenPayload = decodeJwtPayload(data.access_token);
  const email =
    data.email ||
    data.user?.email ||
    fallback.email ||
    tokenPayload.email ||
    localStorage.getItem("user_email") ||
    "";
  const storedEmail = localStorage.getItem("user_email");
  const storedName =
    storedEmail && storedEmail === email
      ? localStorage.getItem("user_name")
      : "";

  return {
    nombre:
      data.nombre ||
      data.name ||
      data.user?.nombre ||
      data.user?.name ||
      fallback.nombre ||
      fallback.name ||
      storedName ||
      "",
    email,
  };
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("access_token"),
  );
  const [role, setRole] = useState(() => localStorage.getItem("user_role"));
  const [user, setUser] = useState(() => ({
    nombre: localStorage.getItem("user_name") || "",
    email: localStorage.getItem("user_email") || "",
  }));
  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(token);

  useEffect(() => {
    const clearUnauthorizedSession = () => {
      setToken(null);
      setRole(null);
      setUser({ nombre: "", email: "" });
    };

    window.addEventListener("auth:unauthorized", clearUnauthorizedSession);

    return () => {
      window.removeEventListener("auth:unauthorized", clearUnauthorizedSession);
    };
  }, []);

  const saveSession = (data, fallback = {}) => {
    const accessToken = data.access_token;

    if (!accessToken) {
      throw new Error("La respuesta de autenticación no incluye access_token.");
    }

    const tokenPayload = decodeJwtPayload(accessToken);
    const userRole = data.rol || data.role || tokenPayload.rol || "estudiante";
    const nextUser = buildUser(data, fallback);

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user_role", userRole);
    localStorage.setItem("user_email", nextUser.email);

    if (nextUser.nombre) {
      localStorage.setItem("user_name", nextUser.nombre);
    } else {
      localStorage.removeItem("user_name");
    }

    setToken(accessToken);
    setRole(userRole);
    setUser(nextUser);
  };

  const login = async (credentials) => {
    setLoading(true);

    try {
      const data = await iniciarSesion(credentials);

      saveSession(data, credentials);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);

    try {
      const data = await registrarUsuario(userData);

      saveSession(data, userData);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    setLoading(true);

    try {
      const data = await autenticarConGoogle(credential);

      saveSession(data);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);

    try {
      return await solicitarRecuperacionPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setLoading(true);

    try {
      const data = await restablecerPassword(token, newPassword);

      saveSession(data);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");

    setToken(null);
    setRole(null);
    setUser({ nombre: "", email: "" });
  };

  const value = {
    token,
    role,
    user: {
      ...user,
      rol: role,
    },
    isAuthenticated,
    loading,
    login,
    register,
    loginWithGoogle,
    forgotPassword,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
