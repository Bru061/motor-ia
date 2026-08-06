import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiRefreshCw, FiSearch, FiTarget, FiUsers } from "react-icons/fi";
import { obtenerUsuariosAdmin } from "../../api/adminApi";
import EmptyState from "../../components/ui/EmptyState";
import PageHeading from "../../components/ui/PageHeading";
import PageLoader from "../../components/ui/PageLoader";
import SelectDropdown from "../../components/ui/SelectDropdown";
import useToast from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/apiError";
import AdminPagination from "./components/AdminPagination";
import AdminUsersTable from "./components/AdminUsersTable";

const DEFAULT_LIMIT = 5;

function getPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function AdminUsuariosPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = getPositiveInteger(searchParams.get("page"), 1);
  const limit = Math.min(
    100,
    getPositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT),
  );
  const search = searchParams.get("search") || "";
  const metaProfesional = searchParams.get("meta") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [metaInput, setMetaInput] = useState(metaProfesional);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Debounce: espera 400ms sin escribir antes de aplicar el filtro,
  // así la búsqueda se refleja mientras el usuario escribe, sin
  // necesidad de un botón de "Buscar".
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedSearch = searchInput.trim();
      const trimmedMeta = metaInput.trim();

      if (trimmedSearch !== search || trimmedMeta !== metaProfesional) {
        updateParams({
          search: trimmedSearch,
          meta: trimmedMeta,
          page: 1,
          limit,
        });
      }
    }, 400);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, metaInput]);

  useEffect(() => {
    let ignoreResults = false;

    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await obtenerUsuariosAdmin({
          page,
          limit,
          search,
          metaProfesional,
        });

        if (!ignoreResults) {
          setData(response);
        }
      } catch (err) {
        if (!ignoreResults) {
          const message = getApiErrorMessage(
            err,
            "No fue posible cargar los usuarios registrados.",
          );

          setError(message);
          toast.error(message);
        }
      } finally {
        if (!ignoreResults) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      ignoreResults = true;
    };
  }, [limit, metaProfesional, page, retryCount, search, toast]);

  const users = useMemo(() => data?.usuarios || [], [data]);
  const pages = data?.pages || 0;
  const total = data?.total || 0;

  const summary = useMemo(
    () => ({
      conPerfil: users.filter((user) => user.tiene_perfil).length,
      conRutaActiva: users.filter((user) => user.tiene_ruta_activa).length,
    }),
    [users],
  );

  const updateParams = (nextValues) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchInput("");
    setMetaInput("");
    updateParams({ search: "", meta: "", page: 1, limit });
  };

  const handleLimitChange = (nextLimit) => {
    updateParams({ limit: nextLimit, page: 1, search, meta: metaProfesional });
  };

  const handlePageChange = (nextPage) => {
    updateParams({ page: nextPage, limit, search, meta: metaProfesional });
  };

  return (
    <section className="admin-page">
      <PageHeading
        eyebrow="Panel administrativo"
        icon={FiUsers}
        title="Usuarios registrados"
        description="Consulta usuarios por nombre, correo o meta profesional."
      />

      <div className="admin-toolbar">
        <label className="admin-search" htmlFor="admin-users-search">
          <FiSearch aria-hidden="true" />
          <input
            id="admin-users-search"
            name="search"
            type="search"
            placeholder="Buscar por nombre o correo..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <label className="admin-search" htmlFor="admin-users-meta">
          <FiTarget aria-hidden="true" />
          <input
            id="admin-users-meta"
            name="meta"
            type="search"
            placeholder="Filtrar por meta profesional..."
            value={metaInput}
            onChange={(event) => setMetaInput(event.target.value)}
          />
        </label>

        <div className="admin-toolbar__actions">
          <SelectDropdown
            label="Por página"
            value={limit}
            options={[5, 10, 20, 50, 100].map((option) => ({
              value: option,
              label: String(option),
            }))}
            onChange={handleLimitChange}
          />
          {isLoading && (
            <span className="admin-search-status">Buscando...</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <PageLoader
          title="Cargando usuarios"
          description="Consultando usuarios registrados."
        />
      ) : error ? (
        <EmptyState
          icon={FiRefreshCw}
          tone="error"
          title="No pudimos cargar usuarios"
          description={error}
          action={
            <button
              className="route-button route-button--primary"
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              <FiRefreshCw aria-hidden="true" />
              Reintentar
            </button>
          }
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title={
            search || metaProfesional
              ? "Sin resultados"
              : "No hay usuarios registrados"
          }
          description={
            search || metaProfesional
              ? "No se encontraron usuarios que coincidan con la búsqueda."
              : "Cuando existan usuarios registrados aparecerán en este listado."
          }
          action={
            search || metaProfesional ? (
              <button
                className="route-button route-button--secondary"
                type="button"
                onClick={clearFilters}
              >
                Limpiar búsqueda
              </button>
            ) : null
          }
        />
      ) : (
        <article className="admin-panel users-panel">
          <div className="section-heading">
            <div>
              <h2>Listado de usuarios</h2>
              <span>
                {total} usuario{total === 1 ? "" : "s"} en total
              </span>
            </div>
            <div className="admin-panel__actions">
              <span>{summary.conPerfil} con perfil en esta página</span>
              <span>
                {summary.conRutaActiva} con ruta activa en esta página
              </span>
            </div>
          </div>

          <AdminUsersTable users={users} />

          <AdminPagination
            page={data.page}
            pages={pages}
            total={total}
            limit={data.limit}
            onPageChange={handlePageChange}
          />
        </article>
      )}
    </section>
  );
}

export default AdminUsuariosPage;
