import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

function FloatingInput({
  autoComplete,
  id,
  label,
  name,
  onChange,
  type = "text",
  value,
  ...inputProps
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && isPasswordVisible ? "text" : type;

  return (
    <div
      className={`auth-floating-field ${
        isPassword ? "auth-floating-field--with-action" : ""
      }`}
    >
      <input
        id={id}
        name={name}
        type={inputType}
        placeholder=" "
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        {...inputProps}
      />
      <label htmlFor={id}>{label}</label>

      {isPassword && (
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setIsPasswordVisible((current) => !current)}
          aria-label={
            isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"
          }
          title={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {isPasswordVisible ? (
            <FiEyeOff aria-hidden="true" />
          ) : (
            <FiEye aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}

export default FloatingInput;
