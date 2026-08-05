import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCheck,
  FiLayers,
  FiMail,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiTarget,
  FiUser,
} from "react-icons/fi";
import {
  actualizarPerfil,
  crearPerfil,
  obtenerCategoriasPerfil,
  obtenerPerfilActual,
} from "../../api/perfilApi";
import EmptyState from "../../components/ui/EmptyState";
import LoadingButton from "../../components/ui/LoadingButton";
import PageLoader from "../../components/ui/PageLoader";
import Skeleton from "../../components/ui/Skeleton";
import UserAvatar from "../../components/ui/UserAvatar";
import useAuth from "../../hooks/useAuth";
import useToast from "../../hooks/useToast";
import { formatRole, getUserDisplayName } from "../../utils/user";
import "../../styles/perfil.css";

const EMPTY_FORM = {
  meta_profesional: "",
  nivel_actual: "",
  categorias_ids: [],
};

const LEVELS = [
  {
    value: "junior",
    label: "Junior",
    description: "Estoy construyendo fundamentos y experiencia práctica.",
  },
  {
    value: "mid",
    label: "Mid",
    description: "Trabajo de forma autónoma y quiero profundizar habilidades.",
  },
  {
    value: "senior",
    label: "Senior",
    description: "Lidero decisiones técnicas y busco una especialización avanzada.",
  },
];

const FIELD_LABELS = {
  meta_profesional: "Meta profesional",
  nivel_actual: "Nivel actual",
  categorias_ids: "Categorías",
};

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const fieldName = item.loc?.at(-1);
        const fieldLabel = FIELD_LABELS[fieldName] || fieldName;

        return fieldLabel ? `${fieldLabel}: ${item.msg}` : item.msg;
      })
      .join(" ");
  }

  return fallbackMessage;
}

function formFromProfile(profile) {
  return {
    meta_profesional: profile.meta_profesional || "",
    nivel_actual: profile.nivel_actual || "",
    categorias_ids: (profile.tecnologias || [])
      .map((tecnologia) => tecnologia.categoria?.id)
      .filter(Boolean),
  };
}

function PerfilLoading({ isLoadingCategories }) {
  return (
    <section className="perfil-page">
      <PageLoader
        className="perfil-state"
        title="Cargando perfil tecnológico"
        description={
          isLoadingCategories
            ? "Consultando categorías disponibles..."
            : "Consultando tu perfil actual..."
        }
      >
        <div className="perfil-skeleton" aria-hidden="true">
          <Skeleton height="68px" />
          <Skeleton height="96px" />
          <Skeleton height="96px" />
        </div>
      </PageLoader>
    </section>
  );
}

function PerfilPage() {
  const toast = useToast();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadErrors, setLoadErrors] = useState({ categories: "", profile: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignoreResults = false;

    const loadCategories = async () => {
      try {
        const data = await obtenerCategoriasPerfil();

        if (!ignoreResults) {
          setCategories(data);
        }
      } catch (error) {
        if (!ignoreResults) {
          const message = getApiErrorMessage(
            error,
            "No fue posible cargar las categorías tecnológicas.",
          );

          setLoadErrors((current) => ({
            ...current,
            categories: message,
          }));
          toast.error(message, { title: "Categorías no disponibles" });
        }
      } finally {
        if (!ignoreResults) {
          setIsLoadingCategories(false);
        }
      }
    };

    const loadProfile = async () => {
      try {
        const data = await obtenerPerfilActual();

        if (!ignoreResults) {
          setFormData(formFromProfile(data));
          setHasProfile(true);
        }
      } catch (error) {
        if (ignoreResults) {
          return;
        }

        if (error.response?.status === 404) {
          setHasProfile(false);
        } else {
          const message = getApiErrorMessage(
            error,
            "No fue posible cargar tu perfil tecnológico.",
          );

          setLoadErrors((current) => ({
            ...current,
            profile: message,
          }));
          toast.error(message, { title: "Perfil no disponible" });
        }
      } finally {
        if (!ignoreResults) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadCategories();
    loadProfile();

    return () => {
      ignoreResults = true;
    };
  }, [retryCount, toast]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => ({ ...current, [field]: "" }));
    setSaveError("");
    setSuccessMessage("");
  };

  const toggleCategory = (categoryId) => {
    const isSelected = formData.categorias_ids.includes(categoryId);
    const nextCategories = isSelected
      ? formData.categorias_ids.filter((id) => id !== categoryId)
      : [...formData.categorias_ids, categoryId];

    updateField("categorias_ids", nextCategories);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.meta_profesional.trim()) {
      errors.meta_profesional = "La meta profesional es obligatoria.";
    }

    if (!formData.nivel_actual) {
      errors.nivel_actual = "Selecciona tu nivel actual.";
    }

    if (formData.categorias_ids.length === 0) {
      errors.categorias_ids = "Selecciona al menos una categoría.";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.warning("Revisa los campos marcados antes de continuar.");
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving || !validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSuccessMessage("");

    const payload = {
      meta_profesional: formData.meta_profesional.trim(),
      nivel_actual: formData.nivel_actual,
      categorias_ids: formData.categorias_ids,
    };

    try {
      const savedProfile = hasProfile
        ? await actualizarPerfil(payload)
        : await crearPerfil(payload);
      const message = hasProfile
        ? "Perfil actualizado correctamente."
        : "Perfil creado correctamente.";

      setFormData(formFromProfile(savedProfile));
      setSuccessMessage(message);
      setHasProfile(true);
      toast.success(message);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "No fue posible guardar el perfil. Intenta nuevamente.",
      );

      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isInitialLoading = isLoadingCategories || isLoadingProfile;
  const hasLoadError = loadErrors.categories || loadErrors.profile;

  const retryLoad = () => {
    setIsLoadingCategories(true);
    setIsLoadingProfile(true);
    setLoadErrors({ categories: "", profile: "" });
    setSaveError("");
    setSuccessMessage("");
    setRetryCount((count) => count + 1);
  };

  if (isInitialLoading) {
    return <PerfilLoading isLoadingCategories={isLoadingCategories} />;
  }

  if (hasLoadError) {
    return (
      <section className="perfil-page">
        <EmptyState
          className="perfil-state perfil-state--error"
          icon={FiAlertCircle}
          tone="error"
          title="No pudimos preparar tu perfil"
          description={[loadErrors.categories, loadErrors.profile]
            .filter(Boolean)
            .join(" ")}
          action={
            <button type="button" onClick={retryLoad}>
              <FiRefreshCw aria-hidden="true" />
              Intentar de nuevo
            </button>
          }
        />
      </section>
    );
  }

  return (
    <section className="perfil-page">
      <header className="perfil-heading">
        <div>
          <span className="perfil-eyebrow">
            <FiUser aria-hidden="true" />
            Perfil tecnológico
          </span>
          <h1>{hasProfile ? "Actualiza tu perfil" : "Construye tu punto de partida"}</h1>
          <p>
            Define tu meta y experiencia para que Motor IA pueda personalizar tu
            ruta de aprendizaje.
          </p>
        </div>

        <span className={`perfil-mode ${hasProfile ? "perfil-mode--edit" : ""}`}>
          {hasProfile ? "Modo edición" : "Perfil nuevo"}
        </span>
      </header>

      <form className="perfil-form" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={isSaving} aria-label="Datos del perfil tecnológico">
          <article className="perfil-section">
            <div className="perfil-section__heading">
              <span>
                <FiTarget aria-hidden="true" />
              </span>
              <div>
                <h2>Meta profesional</h2>
                <p>Escribe el rol o especialización que quieres alcanzar.</p>
              </div>
            </div>

            <label className="perfil-field" htmlFor="meta_profesional">
              <span>Tu objetivo</span>
              <input
                id="meta_profesional"
                name="meta_profesional"
                type="text"
                maxLength="255"
                placeholder="Ej. Desarrollador Backend con Python"
                value={formData.meta_profesional}
                onChange={(event) =>
                  updateField("meta_profesional", event.target.value)
                }
                aria-invalid={Boolean(validationErrors.meta_profesional)}
                aria-describedby={
                  validationErrors.meta_profesional
                    ? "meta_profesional_error"
                    : undefined
                }
              />
            </label>
            {validationErrors.meta_profesional && (
              <p className="perfil-field-error" id="meta_profesional_error">
                {validationErrors.meta_profesional}
              </p>
            )}
          </article>

          <article className="perfil-section">
            <div className="perfil-section__heading">
              <span>
                <FiLayers aria-hidden="true" />
              </span>
              <div>
                <h2>Nivel actual</h2>
                <p>Selecciona la opción que mejor representa tu experiencia.</p>
              </div>
            </div>

            <div
              className="perfil-levels"
              role="group"
              aria-label="Nivel actual"
              aria-describedby={
                validationErrors.nivel_actual ? "nivel_actual_error" : undefined
              }
            >
              {LEVELS.map((level) => {
                const isSelected = formData.nivel_actual === level.value;

                return (
                  <button
                    className={`perfil-level ${isSelected ? "perfil-level--selected" : ""}`}
                    type="button"
                    key={level.value}
                    aria-pressed={isSelected}
                    onClick={() => updateField("nivel_actual", level.value)}
                  >
                    <span className="perfil-level__check" aria-hidden="true">
                      {isSelected && <FiCheck />}
                    </span>
                    <strong>{level.label}</strong>
                    <small>{level.description}</small>
                  </button>
                );
              })}
            </div>
            {validationErrors.nivel_actual && (
              <p className="perfil-field-error" id="nivel_actual_error">
                {validationErrors.nivel_actual}
              </p>
            )}
          </article>

          <article className="perfil-section">
            <div className="perfil-section__heading">
              <span>
                <FiLayers aria-hidden="true" />
              </span>
              <div>
                <h2>Categorías tecnológicas</h2>
                <p>Elige una o varias áreas que quieras incluir en tu ruta.</p>
              </div>
            </div>

            {categories.length > 0 ? (
              <div
                className="perfil-categories"
                role="group"
                aria-label="Categorías tecnológicas"
                aria-describedby={
                  validationErrors.categorias_ids
                    ? "categorias_ids_error"
                    : undefined
                }
              >
                {categories.map((category) => {
                  const isSelected = formData.categorias_ids.includes(category.id);

                  return (
                    <button
                      className={`perfil-category ${isSelected ? "perfil-category--selected" : ""}`}
                      type="button"
                      key={category.id}
                      aria-pressed={isSelected}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <span className="perfil-category__check" aria-hidden="true">
                        {isSelected && <FiCheck />}
                      </span>
                      <strong>{category.nombre}</strong>
                      {category.descripcion && <small>{category.descripcion}</small>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                className="perfil-empty-state"
                icon={FiLayers}
                tone="warning"
                title="Sin categorías disponibles"
                description="No hay categorías para seleccionar en este momento."
              />
            )}
            {validationErrors.categorias_ids && (
              <p className="perfil-field-error" id="categorias_ids_error">
                {validationErrors.categorias_ids}
              </p>
            )}
          </article>
        </fieldset>

        <div className="perfil-actions">
          <p>
            {formData.categorias_ids.length} categoría
            {formData.categorias_ids.length === 1 ? " seleccionada" : "s seleccionadas"}
          </p>
          <LoadingButton
            type="submit"
            isLoading={isSaving}
            loadingText="Guardando..."
            disabled={categories.length === 0}
          >
            <FiSave aria-hidden="true" />
            {hasProfile ? "Actualizar perfil" : "Crear perfil"}
          </LoadingButton>
        </div>
      </form>
    </section>
  );
}

export default PerfilPage;
