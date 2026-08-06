import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage > 2) {
    pages.add(currentPage - 1);
  }

  if (currentPage < totalPages - 1) {
    pages.add(currentPage + 1);
  }

  return [...pages]
    .sort((first, second) => first - second)
    .reduce((result, page, index, source) => {
      if (index > 0 && page - source[index - 1] > 1) {
        result.push("ellipsis");
      }

      result.push(page);
      return result;
    }, []);
}

function AdminPagination({ page, pages, total, limit, onPageChange }) {
  if (!pages || pages <= 1) {
    return (
      <div className="table-footer">
        <span>
          {total} usuario{total === 1 ? "" : "s"} encontrado
          {total === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  const firstItem = (page - 1) * limit + 1;
  const lastItem = Math.min(total, page * limit);
  const visiblePages = getVisiblePages(page, pages);

  return (
    <div className="table-footer">
      <span>
        Mostrando {firstItem}-{lastItem} de {total}
      </span>
      <nav className="pagination" aria-label="Paginación de usuarios">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        {visiblePages.map((item, index) =>
          item === "ellipsis" ? (
            <span className="pagination__ellipsis" key={`ellipsis-${index}`}>
              ...
            </span>
          ) : (
            <button
              className={item === page ? "is-active" : ""}
              type="button"
              key={item}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

export default AdminPagination;
