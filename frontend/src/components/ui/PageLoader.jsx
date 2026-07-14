import Spinner from "./Spinner";

function PageLoader({ children, className = "", description, title }) {
  return (
    <section className={`ui-page-loader ${className}`.trim()} role="status" aria-live="polite">
      <Spinner />
      <div>
        {title && <h1>{title}</h1>}
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default PageLoader;
