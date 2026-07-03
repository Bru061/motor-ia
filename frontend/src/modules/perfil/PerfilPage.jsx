import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheck,
  FiLayers,
  FiSave,
  FiTarget,
  FiUser,
} from "react-icons/fi";
import {
  actualizarPerfil,
  crearPerfil,
  obtenerCategoriasPerfil,
  obtenerPerfilActual,
} from "../../api/perfilApi";
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

function PerfilPage() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
          setLoadErrors((current) => ({
            ...current,
            categories: getApiErrorMessage(
              error,
              "No fue posible cargar las categorías tecnológicas.",
            ),
          }));
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
          setLoadErrors((current) => ({
            ...current,
            profile: getApiErrorMessage(
              error,
              "No fue posible cargar tu perfil tecnológico.",
            ),
          }));
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
  }, []);

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

      setFormData(formFromProfile(savedProfile));
      setSuccessMessage(
        hasProfile
          ? "Perfil actualizado correctamente."
          : "Perfil creado correctamente.",
      );
      setHasProfile(true);
    } catch (error) {
      setSaveError(
        getApiErrorMessage(
          error,
          "No fue posible guardar el perfil. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isInitialLoading = isLoadingCategories || isLoadingProfile;
  const hasLoadError = loadErrors.categories || loadErrors.profile;

  if (isInitialLoading) {
    return (
      <section className="perfil-page">
        <div className="perfil-state" role="status" aria-live="polite">
          <span className="perfil-spinner" aria-hidden="true" />
          <h1>Cargando perfil tecnológico</h1>
          <p>
            {isLoadingCategories
              ? "Consultando categorías disponibles..."
              : "Consultando tu perfil actual..."}
          </p>
        </div>
      </section>
    );
  }

  if (hasLoadError) {
    return (
      <section className="perfil-page">
        <div className="perfil-state perfil-state--error" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <h1>No pudimos preparar tu perfil</h1>
          {loadErrors.categories && <p>{loadErrors.categories}</p>}
          {loadErrors.profile && <p>{loadErrors.profile}</p>}
          <button type="button" onClick={() => window.location.reload()}>
            Intentar de nuevo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="perfil-page">
      <header className="perfil-heading">
        <div>
          <span className="perfil-eyebrow">
            <FiUser />
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
        <fieldset disabled={isSaving}>
          <article className="perfil-section">
            <div className="perfil-section__heading">
              <span>
                <FiTarget />
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
                aria-describedby="meta_profesional_error"
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
                <FiLayers />
              </span>
              <div>
                <h2>Nivel actual</h2>
                <p>Selecciona la opción que mejor representa tu experiencia.</p>
              </div>
            </div>

            <div className="perfil-levels" role="group" aria-label="Nivel actual">
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
                    <span className="perfil-level__check">
                      {isSelected && <FiCheck />}
                    </span>
                    <strong>{level.label}</strong>
                    <small>{level.description}</small>
                  </button>
                );
              })}
            </div>
            {validationErrors.nivel_actual && (
              <p className="perfil-field-error">{validationErrors.nivel_actual}</p>
            )}
          </article>

          <article className="perfil-section">
            <div className="perfil-section__heading">
              <span>
                <FiLayers />
              </span>
              <div>
                <h2>Categorías tecnológicas</h2>
                <p>Elige una o varias áreas que quieras incluir en tu ruta.</p>
              </div>
            </div>

            {categories.length > 0 ? (
              <div className="perfil-categories">
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
                      <span className="perfil-category__check">
                        {isSelected && <FiCheck />}
                      </span>
                      <strong>{category.nombre}</strong>
                      {category.descripcion && <small>{category.descripcion}</small>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="perfil-empty-categories">
                No hay categorías disponibles en este momento.
              </p>
            )}
            {validationErrors.categorias_ids && (
              <p className="perfil-field-error">{validationErrors.categorias_ids}</p>
            )}
          </article>
        </fieldset>

        {saveError && (
          <div className="perfil-feedback perfil-feedback--error" role="alert">
            <FiAlertCircle />
            <span>{saveError}</span>
          </div>
        )}

        {successMessage && (
          <div className="perfil-feedback perfil-feedback--success" role="status">
            <FiCheck />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="perfil-actions">
          <p>
            {formData.categorias_ids.length} categoría
            {formData.categorias_ids.length === 1 ? " seleccionada" : "s seleccionadas"}
          </p>
          <button type="submit" disabled={isSaving || categories.length === 0}>
            <FiSave />
            {isSaving
              ? "Guardando..."
              : hasProfile
                ? "Actualizar perfil"
                : "Crear perfil"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default PerfilPage;
