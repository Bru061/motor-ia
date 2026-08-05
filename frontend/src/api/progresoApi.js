import api from "./axios";

export const obtenerRutaActiva = async () => {
  const response = await api.get("/progreso/ruta-activa");
  return response.data;
};

export const actualizarProgresoModulo = async (moduloId, estado) => {
  const response = await api.patch(`/progreso/modulos/${moduloId}`, { estado });
  return response.data;
};

export const actualizarProgresoRecurso = async (recursoId, estado) => {
  const response = await api.patch(`/progreso/recursos/${recursoId}`, { estado });
  return response.data;
};

export const obtenerResumenProgreso = async () => {
  const response = await api.get("/progreso/resumen");
  return response.data;
};