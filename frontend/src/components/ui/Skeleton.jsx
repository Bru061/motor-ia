function Skeleton({ className = "", height, radius, width }) {
  const style = {
    ...(height ? { height } : {}),
    ...(radius ? { borderRadius: radius } : {}),
    ...(width ? { width } : {}),
  };

  return (
    <span
      className={`ui-skeleton ${className}`.trim()}
      aria-hidden="true"
      style={style}
    />
  );
}

export default Skeleton;
