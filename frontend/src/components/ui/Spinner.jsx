function Spinner({ className = "", label, size = "md" }) {
  const classes = ["ui-spinner", `ui-spinner--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    />
  );
}

export default Spinner;
