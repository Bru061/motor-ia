import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

/**
 * Dropdown propio para reemplazar los <select> nativos en zonas donde
 * el popup del navegador no respeta el tema oscuro de la app.
 *
 * options: [{ value, label }]
 */
function SelectDropdown({ value, options, onChange, label, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = options.find(
    (option) => String(option.value) === String(value),
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    setIsOpen(false);
    if (String(option.value) !== String(value)) {
      onChange(option.value);
    }
  };

  return (
    <div className={`select-dropdown ${className}`} ref={containerRef}>
      {label && <span className="select-dropdown__label">{label}</span>}
      <button
        type="button"
        className="select-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selected?.label ?? ""}</span>
        <FiChevronDown
          aria-hidden="true"
          className={
            isOpen
              ? "select-dropdown__chevron is-open"
              : "select-dropdown__chevron"
          }
        />
      </button>

      {isOpen && (
        <ul className="select-dropdown__menu" role="listbox">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);

            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={
                    isSelected
                      ? "select-dropdown__option is-selected"
                      : "select-dropdown__option"
                  }
                  onClick={() => handleSelect(option)}
                >
                  <span>{option.label}</span>
                  {isSelected && <FiCheck aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SelectDropdown;
