import api from "./axios";

export const obtenerRutaActiva = async () => {
  const response = await api.get("/progreso/ruta-activa");
  return response.data;
};

export const obtenerResumenProgreso = async () => {
  const response = await api.get("/progreso/resumen");
  return response.data;
};
