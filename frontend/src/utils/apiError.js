// Extrae un mensaje de error legible de una respuesta de Axios/FastAPI.
// FastAPI responde errores como { detail: "mensaje" } (o un array de
// errores de validación, que no se maneja aquí; ver PerfilPage para ese caso).
export function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail;
  return typeof detail === "string" ? detail : fallbackMessage;
}
