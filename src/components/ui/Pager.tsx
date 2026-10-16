export function Pager({
  page,
  total,
  setPage,
}: {
  page: number;
  total: number;
  setPage: (v: number) => void;
}) {
  return total > 12 ? (
    <div className="pager">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <span>
        {page} / {Math.ceil(total / 12)}
      </span>
      <button disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  ) : null;
}
