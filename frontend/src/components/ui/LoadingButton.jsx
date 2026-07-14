import Spinner from "./Spinner";

function LoadingButton({
  children,
  className = "",
  disabled,
  isLoading = false,
  loadingText = "Cargando...",
  type = "button",
  ...props
}) {
  return (
    <button
      className={`ui-loading-button ${className}`.trim()}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner className="ui-loading-button__spinner" size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default LoadingButton;
