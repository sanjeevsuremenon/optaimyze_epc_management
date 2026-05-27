import React, { useState } from "react";
import moment from "moment";

import {
  useTable,
  useGlobalFilter,
  useAsyncDebounce,
  useFilters,
  useSortBy,
} from "react-table";

// global filter function (search)

function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <label className="flex gap-x-2 items-baseline">
      <span className="text-slate-300 text-sm font-medium uppercase">
        Search
      </span>

      <input
        type="text"
        className="mt-1 px-3 py-2 block text-sm w-full rounded-md bg-slate-900/70 border border-slate-700 text-slate-100 shadow-sm focus:border-cyan-500 focus:ring focus:ring-cyan-500/20"
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`search in ${count} records`}
      />
    </label>
  );
}

// function column filters

export function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id, render },
}) {
  const options = React.useMemo(() => {
    const options = new Set();
    preFilteredRows.forEach((row) => {
      options.add(row.values[id]);
    });
    return [...options.values()];
  }, [id, preFilteredRows]);

  return (
    <label className="flex gap-x-1 items-baseline">
      <span className="text-slate-300 text-sm font-bold uppercase">
        {render("Header")}: {" "}
      </span>
      <select
        className="mt-1 p-2 text-[11px] w-full rounded-md bg-slate-900/70 border border-slate-700 text-slate-100 shadow-sm focus:border-cyan-500 focus:ring focus:ring-cyan-500/20"
        name={id}
        id={id}
        value={filterValue}
        onChange={(e) => {
          setFilter(e.target.value || undefined);
        }}
      >
        <option value="" className="text-blue-900 font-bold text-[10px]">
          All
        </option>
        {options.map((option, i) => (
          <option key={i} value={option} className="text-red-900 text-[10px]">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

// first a utility function
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Mattype({ value }) {
  const type = value ? value.toUpperCase() : "unknown";

  return (
    <span
      className={classNames(
        "px-3 py-1 uppercase leading-wide font-bold text-[10px] rounded-full shadow-sm",
        value.startsWith("ZMEC") ? "bg-green-100 text-green-700" : null,
        value.startsWith("ZELC") ? "bg-yellow-100 text-yellow-700" : null,
        value.startsWith("ZCVL") ? "bg-red-100 text-red-700" : null,
        value.startsWith("UNBW") ? "bg-blue-100 text-blue-700" : null,
        value.startsWith("ZINS") ? "bg-zinc-100 text-zinc-700" : null,
        value.startsWith("ZOFC") ? "bg-purple-100 text-purple-700" : null,
        value.startsWith("ZCHN") ? "bg-sky-100 text-sky-700" : null
      )}
    >
      {value}
    </span>
  );
}

export function Cellstyle({ value }) {
  return (
    <span className="text-sm text-slate-100">
      {value}
    </span>
  );
}

export function Datestyle({ value }) {
  return (
    <span className="text-sm text-cyan-300 font-medium">
      {moment(value).format("DD MMM YYYY")}
    </span>
  );
}

export function Numberstyle({ value }) {
  return (
    <span className={classNames("px-3 text-yellow-900 text-[14px] font-bold py-1 text-copper-900  tracking-wider")}>
      {(Math.round(value * 100) / 100).toLocaleString("en-US", { style: "currency", currency: "SAR" })}
    </span>
  );
}

export function Numberstylesim1({ value }) {
  return (
    <span className={classNames(" text-yellow-900 text-[12px] font-bold  text-copper-900 shadow-md shadow-stone-600")}>
      {(Math.round(value * 100) / 100).toLocaleString("en-US", { style: "currency", currency: "SAR" })}
    </span>
  );
}

export function Numberstylesim({ value }) {
  return (
    <span className={classNames(" text-yellow-900 text-[12px] font-bold  text-copper-900 shadow-md shadow-stone-600")}>
      {value}
    </span>
  );
}

export function Boldstyle1({ value }) {
  return (
    <span className={classNames("px-3 py-1 text-zinc-900 font-bold text-[12px]")}>
      {value}
    </span>
  );
}

export function Boldstyle2({ value }) {
  return (
    <span
      className={classNames(
        "px-3 py-1 text-zinc-800 font-bold border-sm border-zinc-900 text-[12px] tracking-wide "
      )}
    >
      {value}
    </span>
  );
}

export function Boldstylesim({ value }) {
  return (
    <span
      className={classNames(
        "text-zinc-800 font-bold text-[12px]"
      )}
    >
      {value}
    </span>
  );
}

export function Boldstylesim1({ value }) {
  return (
    <span
      className={classNames(
        "text-teal-900 font-black shadow-md shadow-cyan-800 px-1 py-1 text-[12px]"
      )}
    >
      {value}
    </span>
  );
}

export function Normalstylesim({ value }) {
  return (
    <span
      className={classNames(
        " text-zinc-800 font-semibold text-[12px] tracking-tighter "
      )}
    >
      {value}
    </span>
  );
}

export function Specialstylesim({ value }) {
  return (
    <span
      className={classNames(
        " text-white bg-cyan-800 px-2 py-1 shadow-md shadow-cyan-400 font-semibold text-[12px] tracking-tighter"
      )}
    >
      {value}
    </span>
  );
}

export function Spstylesim({ value }) {
  return (
    <span
      className={classNames(
        " text-white bg-teal-600 px-2 py-1 tracking-tight font-semibold text-[12px]"
      )}
    >
      {value}
    </span>
  );
}

export function Normalstylesim1({ value }) {
  return (
    <span
      className={classNames(
        "text-blue-900 font-semibold text-[12px] tracking-tight"
      )}
    >
      {value}
    </span>
  );
}

export function Boldstyle3({ value }) {
  return (
    <span className="font-semibold text-sm text-slate-100">
      {value}
    </span>
  );
}

export function Managerstyle({ value }) {
  return (
    <span className="text-sm text-slate-300 font-normal italic">
      {value}
    </span>
  );
}

export function Boldstyle4({ value }) {
  return (
    <span className="italic font-medium text-sm text-slate-100">
      {value}
    </span>
  );
}

// svg files for sort icon
export function SortIcon({ className }) {
  return (
    <svg
      className={className}
      stroke="red"
      fill="red"
      strokeWidth="0"
      viewBox="0 0 320 512"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"></path>
    </svg>
  );
}

export function SortUpIcon({ className }) {
  return (
    <svg
      className={className}
      stroke="red"
      fill="red"
      strokeWidth="0"
      viewBox="0 0 320 512"
      height="2em"
      width="2em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"></path>
    </svg>
  );
}

export function SortDownIcon({ className }) {
  return (
    <svg
      className={className}
      stroke="green"
      fill="green"
      strokeWidth="0"
      viewBox="0 0 320 512"
      height="2em"
      width="2em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"></path>
    </svg>
  );
}

function Tablecomponent({ columns, data, viewMode = 'table', onViewModeChange, enablePagination = false }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
    },
    useFilters,
    useGlobalFilter,
    useSortBy
  );

  const [displayedRows, setDisplayedRows] = useState(Math.min(20, rows.length));
  const [selectedMatcode, setSelectedMatcode] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(false);

  React.useEffect(() => {
    if (!enablePagination) {
      setIsNearBottom(false);
      return;
    }

    const handleWindowScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
      setIsNearBottom(nearBottom && displayedRows < rows.length);
      if (nearBottom) {
        setDisplayedRows((prev) => Math.min(prev + 10, rows.length));
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    handleWindowScroll();
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [rows.length, enablePagination, displayedRows]);

  const visibleRows = enablePagination ? rows.slice(0, displayedRows) : rows;

  return (
    <>
      <div className="mb-4 flex justify-between items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <GlobalFilter
            preGlobalFilteredRows={preGlobalFilteredRows}
            globalFilter={state.globalFilter}
            setGlobalFilter={setGlobalFilter}
          />
        </div>

        {headerGroups.map((headerGroup) =>
          headerGroup.headers.map((column) =>
            column.Filter ? (
              <div key={column.id} className="flex-shrink-0">
                {column.render("Filter")}
              </div>
            ) : null
          )
        )}

        {onViewModeChange && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onViewModeChange('table')}
              className={`px-3 py-2 rounded-md text-sm font-semibold ${viewMode === 'table' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'}`}
            >
              Table
            </button>
            <button
              onClick={() => onViewModeChange('card')}
              className={`px-3 py-2 rounded-md text-sm font-semibold ${viewMode === 'card' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'}`}
            >
              Cards
            </button>
          </div>
        )}
      </div>

      {enablePagination && (
        <div className="sticky top-24 z-20 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/95 px-4 py-3 text-sm text-slate-300 shadow-lg shadow-slate-950/20">
          <span className="font-medium text-slate-100">
            Showing {visibleRows.length} of {rows.length} items
          </span>
          <span className="text-slate-400">
            Scroll down to load more
          </span>
        </div>
      )}

      {viewMode === 'table' ? (
        <div>
          <table className="w-full divide-y divide-slate-700">
            <thead className="sticky top-0 bg-slate-800/80 text-slate-100 font-bold" {...getTableProps()} border="1">
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                  {headerGroup.headers.map((column) => (
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-100 uppercase tracking-wider"
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      key={column.id}
                    >
                      <div className="flex items-center gap-1">
                        {column.render("Header")}
                        <span>
                          {column.isSorted ? (
                            column.isSortedDesc ? (
                              <SortDownIcon className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <SortUpIcon className="w-3 h-3 text-cyan-400" />
                            )
                          ) : null}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-slate-900/40 divide-y divide-slate-700" {...getTableBodyProps()}>
              {visibleRows.map((row, i) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    className={`hover:bg-slate-800/60 transition-colors ${i % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/40'}`}
                    key={row.id}
                  >
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        className="px-4 py-3 text-sm text-slate-200 break-words"
                        key={cell.column.id}
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {enablePagination && displayedRows < rows.length && (
            <div className="text-center py-4 text-slate-400 text-sm">
              Showing {displayedRows} of {rows.length} rows (scroll to load more)
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRows.map((row) => {
            prepareRow(row);
            return (
              <div
                key={row.id}
                className="rounded-lg bg-slate-800/60 border border-slate-700 p-4 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all shadow-md"
              >
                {row.cells.map((cell) => (
                  <div key={cell.column.id} className="mb-3 pb-3 border-b border-slate-700/50 last:border-0 last:mb-0 last:pb-0">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">
                      {cell.column.Header}
                    </div>
                    <div className="text-sm text-slate-100 break-words">
                      {cell.render("Cell")}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {enablePagination && displayedRows < rows.length && viewMode === 'card' && (
        <div className="text-center py-4 text-slate-400 text-sm">
          Showing {displayedRows} of {rows.length} rows (scroll to load more)
        </div>
      )}

      {enablePagination && isNearBottom && displayedRows < rows.length && (
        <div className="fixed right-6 bottom-6 z-50 rounded-2xl border border-cyan-500 bg-slate-950/95 px-4 py-3 text-sm text-cyan-100 shadow-xl shadow-cyan-500/30 backdrop-blur-md">
          Loading more items...
        </div>
      )}
    </>
  );
}

export default Tablecomponent;

