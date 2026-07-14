import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiX,
} from "react-icons/fi";
import { ToastContext } from "./toastContext";

const TOAST_ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

const DEFAULT_TITLES = {
  success: "Listo",
  error: "Ocurrió un problema",
  warning: "Revisa esto",
  info: "Información",
};

function createToastId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = 4600 }) => {
      const safeType = TOAST_ICONS[type] ? type : "info";
      const id = createToastId();
      const toast = {
        id,
        type: safeType,
        title: title || DEFAULT_TITLES[safeType],
        message,
      };

      setToasts((current) => [toast, ...current].slice(0, 4));

      if (duration > 0) {
        const timer = window.setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [removeToast],
  );

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    },
    [],
  );

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
      success: (message, options = {}) =>
        showToast({ ...options, type: "success", message }),
      error: (message, options = {}) =>
        showToast({ ...options, type: "error", message }),
      warning: (message, options = {}) =>
        showToast({ ...options, type: "warning", message }),
      info: (message, options = {}) =>
        showToast({ ...options, type: "info", message }),
    }),
    [removeToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const ToastIcon = TOAST_ICONS[toast.type];

          return (
            <div
              className={`toast toast--${toast.type}`}
              role={toast.type === "error" ? "alert" : "status"}
              key={toast.id}
            >
              <ToastIcon className="toast__icon" aria-hidden="true" />
              <div className="toast__content">
                <strong>{toast.title}</strong>
                {toast.message && <p>{toast.message}</p>}
              </div>
              <button
                className="toast__close"
                type="button"
                aria-label="Cerrar notificación"
                onClick={() => removeToast(toast.id)}
              >
                <FiX aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
