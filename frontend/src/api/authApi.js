import api from "./axios";

export const iniciarSesion = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const registrarUsuario = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const autenticarConGoogle = async (credential) => {
  const response = await api.post("/auth/google", { credential });
  return response.data;
};

export const solicitarRecuperacionPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const restablecerPassword = async (token, newPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    new_password: newPassword,
  });
  return response.data;
};