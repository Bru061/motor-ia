import api from "./axios";

export const generarRuta = async () => {
  const response = await api.post("/rutas/generar");
  return response.data;
};

export const regenerarRuta = async () => {
  const response = await api.post("/rutas/regenerar");
  return response.data;
};
