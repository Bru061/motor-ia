import api from "./axios";

export const obtenerCategoriasPerfil = async () => {
  const response = await api.get("/perfil/categorias");
  return response.data;
};

export const obtenerPerfilActual = async () => {
  const response = await api.get("/perfil/");
  return response.data;
};

export const crearPerfil = async (perfil) => {
  const response = await api.post("/perfil/", perfil);
  return response.data;
};

export const actualizarPerfil = async (perfil) => {
  const response = await api.patch("/perfil/", perfil);
  return response.data;
};
