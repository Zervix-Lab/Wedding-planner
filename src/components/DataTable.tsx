import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** The main column (usually the name): shown large and without a label in card mode. */
  primary?: boolean;
  /** Action buttons column: a row of buttons in card mode, a narrow stacked column in table mode. */
  actions?: boolean;
  className?: string;
}

/**
 * Responsive list:
 *  - below 1280px (phones + tablets): every row is a card (2 per row from 1024px), each value shows its column name
 *  - 1280px and wider: a normal table with a header row
 * Pure CSS, so there is no extra JavaScript and no duplicated markup. Nothing ever needs sideways scrolling.
 */
export function DataTable<T>({ columns, rows, rowKey, dim = false }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; dim?: boolean }) {
  return (
    <div className={`xl:overflow-hidden xl:rounded-2xl xl:border xl:border-stone-300 xl:bg-white xl:shadow-sm ${dim ? "opacity-60" : ""}`}>
      <table className="block w-full text-left xl:table">
        <thead className="hidden bg-rose-50 text-stone-900 xl:table-header-group">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`border-b border-rose-200 px-2.5 py-3 text-base font-bold ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="grid gap-3 lg:grid-cols-2 xl:table-row-group xl:gap-0">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="block rounded-2xl border border-stone-300 bg-white p-3 shadow-sm xl:table-row xl:rounded-none xl:border-0 xl:border-b xl:border-stone-200 xl:p-0 xl:shadow-none xl:odd:bg-white xl:even:bg-stone-50/60 xl:hover:bg-rose-50/60"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  data-label={c.header}
                  className={`flex items-start justify-between gap-3 py-1.5 text-base before:max-w-[42%] before:shrink-0 before:font-semibold before:text-stone-600 before:content-[attr(data-label)] xl:table-cell xl:px-2.5 xl:py-3 xl:align-top xl:before:content-none ${
                    c.primary ? "text-lg font-bold before:hidden" : ""
                  } ${c.actions ? "flex-wrap justify-start pt-2 before:hidden xl:w-px xl:whitespace-nowrap" : ""} ${c.className ?? ""}`}
                >
                  <div className={`min-w-0 break-words ${c.primary || c.actions ? "w-full" : "text-right xl:text-left"}`}>{c.cell(row)}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
