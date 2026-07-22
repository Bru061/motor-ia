import api from "./axios";

export const obtenerUsuariosAdmin = async ({
  page = 1,
  limit = 10,
  search = "",
  metaProfesional = "",
} = {}) => {
  const response = await api.get("/admin/usuarios", {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(metaProfesional.trim()
        ? { meta_profesional: metaProfesional.trim() }
        : {}),
    },
  });

  return response.data;
};

export const obtenerUsuarioAdmin = async (usuarioId) => {
  const response = await api.get(`/admin/usuarios/${usuarioId}`);
  return response.data;
};

export const obtenerTecnologiasDemandadasAdmin = async () => {
  const response = await api.get("/admin/analitica/tecnologias-demandadas");
  return response.data;
};

export const obtenerSkillGapAdmin = async () => {
  const response = await api.get("/admin/analitica/skill-gap");
  return response.data;
};
