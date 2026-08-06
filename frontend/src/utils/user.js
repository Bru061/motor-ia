export function getUserInitials(value) {
  const source = String(value || "").trim();

  if (!source) {
    return "MI";
  }

  const normalized = source.includes("@") ? source.split("@")[0] : source;
  const parts = normalized
    .replace(/[._-]+/g, " ")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "MI";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatRole(role) {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "admin") {
    return "Administrador";
  }

  if (normalizedRole === "estudiante") {
    return "Estudiante";
  }

  return role || "Sin rol asignado";
}

export function getUserDisplayName(user) {
  return user?.nombre || user?.name || user?.email || "Usuario";
}

export function getUserHomePath(role) {
  return String(role || "").toLowerCase() === "admin" ? "/admin" : "/dashboard";
}

export function getUserProfilePath(role) {
  return String(role || "").toLowerCase() === "admin"
    ? "/admin/perfil"
    : "/perfil";
}

export function getUserSettingsPath(role) {
  return String(role || "").toLowerCase() === "admin"
    ? "/admin/configuracion"
    : "/configuracion";
}
