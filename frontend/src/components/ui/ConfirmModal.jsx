import { useEffect } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

/**
 * Modal de confirmación reutilizable, para reemplazar los mensajes de
 * "¿Estás seguro?" que antes se mostraban como un bloque fijo dentro
 * de la página (route-confirmation). Ahora aparece como un overlay
 * centrado, con backdrop, que bloquea el resto de la pantalla hasta
 * que el usuario confirma o cancela.
 */
function ConfirmModal({
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    tone = "danger",
    isConfirming = false,
    onConfirm,
    onCancel,
}) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !isConfirming) {
                onCancel();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isConfirming, onCancel]);

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget && !isConfirming) {
            onCancel();
        }
    };

    return (
        <div
            className="confirm-modal-backdrop"
            role="presentation"
            onMouseDown={handleBackdropClick}
        >
            <div
                className={`confirm-modal confirm-modal--${tone}`}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-description"
            >
                <button
                    className="confirm-modal__close"
                    type="button"
                    aria-label="Cancelar"
                    disabled={isConfirming}
                    onClick={onCancel}
                >
                    <FiX aria-hidden="true" />
                </button>

                <span className="confirm-modal__icon">
                    <FiAlertTriangle aria-hidden="true" />
                </span>

                <h2 id="confirm-modal-title">{title}</h2>
                {description && <p id="confirm-modal-description">{description}</p>}

                <div className="confirm-modal__actions">
                    <button
                        className="route-button route-button--ghost"
                        type="button"
                        disabled={isConfirming}
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className={`route-button route-button--${tone === "danger" ? "danger" : "primary"}`}
                        type="button"
                        disabled={isConfirming}
                        autoFocus
                        onClick={onConfirm}
                    >
                        {isConfirming && <span className="route-button__spinner" aria-hidden="true" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;