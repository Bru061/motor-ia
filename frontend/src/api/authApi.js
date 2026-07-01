import api from "./axios";

export const loginRequest = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const registerRequest = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};