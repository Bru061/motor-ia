import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiRefreshCw, FiSearch, FiUsers, FiX } from "react-icons/fi";
import { obtenerUsuariosAdmin } from "../../api/adminApi";
import EmptyState from "../../components/ui/EmptyState";
import LoadingButton from "../../components/ui/LoadingButton";
import PageLoader from "../../components/ui/PageLoader";
import useToast from "../../hooks/useToast";
import AdminPagination from "./components/AdminPagination";
import AdminUsersTable from "./components/AdminUsersTable";

const DEFAULT_LIMIT = 10;

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

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let ignoreResults = false;

    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await obtenerUsuariosAdmin({ page, limit, search });

        if (!ignoreResults) {
          setData(response);
        }
      } catch (err) {
        if (!ignoreResults) {
          const message =
            err.response?.data?.detail ||
            "No fue posible cargar los usuarios registrados.";

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
  }, [limit, page, retryCount, search, toast]);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSearch = String(formData.get("search") || "").trim();

    updateParams({ search: nextSearch, page: 1, limit });
  };

  const clearSearch = () => {
    updateParams({ search: "", page: 1, limit });
  };

  const handleLimitChange = (event) => {
    updateParams({ limit: event.target.value, page: 1, search });
  };

  const handlePageChange = (nextPage) => {
    updateParams({ page: nextPage, limit, search });
  };

  return (
    <section className="admin-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Usuarios registrados</h1>
          <p>Consulta usuarios por nombre o correo usando el endpoint administrativo.</p>
        </div>
        <Link className="route-button route-button--secondary" to="/admin">
          Volver al dashboard
        </Link>
      </div>

      <form className="admin-toolbar" onSubmit={handleSubmit}>
        <label className="admin-search" htmlFor="admin-users-search">
          <FiSearch aria-hidden="true" />
          <input
            key={search}
            id="admin-users-search"
            name="search"
            type="search"
            placeholder="Buscar por nombre o correo..."
            defaultValue={search}
          />
        </label>

        <div className="admin-toolbar__actions">
          {search && (
            <button className="admin-clear-button" type="button" onClick={clearSearch}>
              <FiX aria-hidden="true" />
              Limpiar
            </button>
          )}
          <label className="admin-limit-select">
            <span>Por página</span>
            <select value={limit} onChange={handleLimitChange}>
              {[10, 20, 50, 100].map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <LoadingButton
            className="route-button route-button--primary"
            type="submit"
            isLoading={isLoading}
            loadingText="Buscando..."
          >
            <FiSearch aria-hidden="true" />
            Buscar
          </LoadingButton>
        </div>
      </form>

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
          title={search ? "Sin resultados" : "No hay usuarios registrados"}
          description={
            search
              ? "El backend no encontró usuarios que coincidan con la búsqueda."
              : "Cuando existan usuarios registrados aparecerán en este listado."
          }
          action={
            search ? (
              <button className="route-button route-button--secondary" type="button" onClick={clearSearch}>
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
              <span>{summary.conRutaActiva} con ruta activa en esta página</span>
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
