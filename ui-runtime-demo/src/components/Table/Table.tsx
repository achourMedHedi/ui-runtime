import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FC } from "react"
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table"
import { URRenderer, getByPath, type URComponentConfig } from "../../../../packages/react/index.tsx"

// Every header/cell is a full ur-react config node — either a plain
// Container/Input/etc. tree, or a reference to a component the app owner
// registered in the components context, rendered exactly like any other
// node. `accessorKey` is omitted for pure display/action columns (e.g. a
// "Remove" button) that don't read a field off the row.
export type TableLeafColumnConfig = {
    id: string
    accessorKey?: string
    header: URComponentConfig
    cell: URComponentConfig
    // Fixed pixel width for this column. Omit to make the column flexible —
    // it splits whatever container width is left over (see `minSize`).
    size?: number
    // Floor for a flexible column's width (a column with no `size`). All
    // flexible columns split the leftover container width evenly on top of
    // their `minSize`; with nothing left over they sit at exactly `minSize`.
    minSize?: number
    // Per-column overrides layered on top of the table-level `headerCellStyle`
    // / `cellStyle` (e.g. right-aligning a single numeric column) — merged
    // last so they win over the table-wide default for just this column.
    headerCellStyle?: CSSProperties
    cellStyle?: CSSProperties
    // Opts this column into click-to-sort. When set, the header config node
    // gets `data.sortDirection` (false | "asc" | "desc"), `data.sortIndicator`
    // (a ready-made "⇅"/"▲"/"▼" glyph, for configs with no conditional logic
    // of their own), and `actions.toggleSort` — how the header actually
    // triggers a sort is entirely up to the header config: a user component
    // can wire the click itself, or a pure-config header can bind a generic
    // component's `onClick` straight to `{{actions.toggleSort}}`.
    sortable?: boolean
    // Opts this column into a text filter (substring match, case-insensitive,
    // against the stringified cell value). When set, the header config node
    // gets, in its data namespace: `filterValue` (the column's *applied*
    // filter text, "" when unset), `filterOpen` (whether this column's
    // filter popover is open — only one column's is open at a time), and
    // `filterDraft` (the in-progress text typed in that popover, separate
    // from `filterValue` until applied). And in its actions namespace:
    // `setFilter` (applies immediately — accepts a raw string or a native
    // change event, so a pure-config header can bind a generic input's
    // `onChange` straight to it), `toggleFilterOpen`, `setFilterDraft`
    // (same dual-signature acceptance as `setFilter`), `applyFilter` (copies
    // the draft into the real filter and closes the popover), and
    // `cancelFilter` (closes without applying). A header can use the simple
    // immediate pair (`filterValue`/`setFilter`, e.g. a plain dropdown) or
    // the popover set — both always reflect the same underlying filter.
    filterable?: boolean
}

// A group has no `accessorKey`/`cell`/sort/filter of its own — it's purely a
// spanning header over a set of leaf columns (one nesting level; a group of
// groups isn't supported, since no config here has needed it yet).
export type TableGroupColumnConfig = {
    id: string
    header: URComponentConfig
    headerCellStyle?: CSSProperties
    columns: TableLeafColumnConfig[]
}

export type TableColumnConfig = TableLeafColumnConfig | TableGroupColumnConfig

const isGroupColumn = (col: TableColumnConfig): col is TableGroupColumnConfig => Array.isArray((col as TableGroupColumnConfig).columns)

// Depth-first leaf columns, in the same left-to-right order tanstack lays out
// `row.getVisibleCells()` and the deepest `getHeaderGroups()` row — used
// anywhere we need the flat, position-indexed list of actual data columns
// (width computation, `<colgroup>`, per-column style overrides, empty-state
// colSpan) regardless of how they're nested into groups for display.
function flattenLeafColumns(columns: TableColumnConfig[]): TableLeafColumnConfig[] {
    return columns.flatMap((col) => (isGroupColumn(col) ? flattenLeafColumns(col.columns) : [col]))
}

const DEFAULT_MIN_SIZE = 100

// Sizes every column so the table fills `containerWidth`: fixed columns
// (`size` set) keep their exact width, flexible columns (no `size`) share
// whatever space is left on top of their `minSize`. If the natural widths
// (size ?? minSize ?? default) already meet or exceed the container, there's
// nothing to distribute — keep the natural widths and let the table overflow.
function computeColumnWidths(columns: TableLeafColumnConfig[], containerWidth: number): number[] {
    const naturalWidths = columns.map((col) => col.size ?? col.minSize ?? DEFAULT_MIN_SIZE)
    if (!containerWidth) return naturalWidths

    const totalNatural = naturalWidths.reduce((sum, w) => sum + w, 0)
    if (totalNatural >= containerWidth) return naturalWidths

    const flexIndices = columns.reduce<number[]>((acc, col, i) => {
        if (col.size === undefined) acc.push(i)
        return acc
    }, [])
    if (!flexIndices.length) return naturalWidths

    const share = (containerWidth - totalNatural) / flexIndices.length
    const widths = [...naturalWidths]
    for (const i of flexIndices) widths[i] += share
    return widths
}

// Every chrome piece the table itself draws (outside the header/cell config
// nodes, which already style themselves) has a sensible default here, and a
// matching `*Style` prop below lets the app owner override or extend it —
// partial overrides merge over the default rather than replacing it wholesale.
const DEFAULT_CONTAINER_STYLE: CSSProperties = {
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
}

const DEFAULT_TABLE_STYLE: CSSProperties = {
    tableLayout: "fixed",
    borderCollapse: "collapse",
    fontSize: 13,
}

const DEFAULT_HEADER_ROW_STYLE: CSSProperties = {}

const DEFAULT_HEADER_CELL_STYLE: CSSProperties = {
    position: "sticky",
    top: 0,
    background: "#fff",
    textAlign: "left",
    // Header cells in the same row can hold very different amounts of
    // content (a label alone vs. label + sort row + filter input) — "top"
    // keeps every header's own first line level with its neighbors instead
    // of each one centering independently in the row's shared height.
    verticalAlign: "top",
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#6b7280",
    fontWeight: 600,
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
}

const DEFAULT_ROW_STYLE: CSSProperties = {}

const DEFAULT_CELL_STYLE: CSSProperties = {
    padding: "8px 10px",
    borderBottom: "1px solid #f3f4f6",
}

const DEFAULT_EMPTY_STATE_STYLE: CSSProperties = {
    padding: 16,
    textAlign: "center",
    color: "#9ca3af",
}

const DEFAULT_EMPTY_STATE_TEXT = "No items yet — add one to get started."

type TableProps = {
    // named `rows`, not `data` — the runtime always force-overrides a
    // component's `data` prop with the ambient inherited context (see
    // UiRuntime.tsx), so `data` can't be repurposed as "the row source".
    rows?: unknown[]
    columns?: TableColumnConfig[]
    // a field name, not a function — JSON can't carry a getRowId function.
    rowId?: string
    // action names to row-bind: inside a row's cells, {{actions.name}} for
    // any name listed here resolves to a wrapper that calls the real action
    // with this row's data as the first argument.
    rowActionKeys?: string[]
    // Style overrides for the table's own chrome — everything the header/cell
    // config nodes themselves don't already control. Each merges over its
    // DEFAULT_* counterpart above, so a JSON config only needs to pass the
    // properties it wants to change, not the whole style object. Note this is
    // distinct from the `style` prop, which the runtime reserves for grid
    // positioning (see UiRuntime.tsx) — it's never handed to this component.
    containerStyle?: CSSProperties
    tableStyle?: CSSProperties
    headerRowStyle?: CSSProperties
    headerCellStyle?: CSSProperties
    rowStyle?: CSSProperties
    cellStyle?: CSSProperties
    emptyStateStyle?: CSSProperties
    emptyStateText?: string
    // extra class appended to every body `<tr>`, alongside the built-in
    // `ur-table-row` (kept for the :hover rule in index.css, which inline
    // styles can't express) — lets a config add its own row-level CSS hooks.
    rowClassName?: string
    // injected automatically by the runtime (see UiRuntime.tsx) — this is
    // the base data/actions every header/cell inherits, extended per-cell
    // (value/row/rowIndex) and per-row (rowActionKeys) below.
    data?: Record<string, any>
    actions?: Record<string, Function>
}

// Builds the per-row actions a cell/header config can bind against: every
// name in `rowActionKeys` gets wrapped so it's called with this row's data
// first, everything else in `actions` passes through untouched. Deliberately
// a plain function, not a hook — this runs once per row inside a `.map()`,
// where hooks aren't allowed.
function buildRowActions(row: unknown, actions: Record<string, Function>, keys?: string[]) {
    if (!keys?.length) return actions
    const wrapped: Record<string, Function> = {}
    for (const key of keys) {
        const fn = actions[key]
        if (typeof fn === "function") wrapped[key] = (...args: unknown[]) => fn(row, ...args)
    }
    return { ...actions, ...wrapped }
}

const Table: FC<TableProps> = ({
    rows = [],
    columns = [],
    rowId = "id",
    rowActionKeys,
    containerStyle,
    tableStyle,
    headerRowStyle,
    headerCellStyle,
    rowStyle,
    cellStyle,
    emptyStateStyle,
    emptyStateText = DEFAULT_EMPTY_STATE_TEXT,
    rowClassName,
    data = {},
    actions = {},
}) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    // Popover-filter UI state — separate from tanstack's own `columnFilters`
    // (the *applied* filter) because a popover needs a draft the user can
    // type into and still cancel out of without touching the real filter.
    // Only one column's popover is open at a time.
    const [openFilterId, setOpenFilterId] = useState<string | null>(null)
    const [filterDrafts, setFilterDrafts] = useState<Record<string, string>>({})

    // useLayoutEffect (not useEffect) so the real width is measured and
    // applied before the browser paints — a plain useEffect runs after
    // paint, so the first frame would render at containerWidth=0 (natural,
    // un-filled column widths) and visibly snap to the real layout a beat
    // later. The synchronous getBoundingClientRect() read covers the very
    // first paint; ResizeObserver's own callback is inherently async (it
    // never fires synchronously, even on initial observe), so it only
    // handles *subsequent* resizes here, not the initial one.
    useLayoutEffect(() => {
        const el = scrollRef.current
        if (!el) return
        setContainerWidth(el.getBoundingClientRect().width)

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width
            if (width) setContainerWidth(width)
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const leafColumns = useMemo(() => flattenLeafColumns(columns), [columns])
    const columnWidths = useMemo(() => computeColumnWidths(leafColumns, containerWidth), [leafColumns, containerWidth])
    const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0)

    // A group column's own header/cell namespace lookup (see the render loop
    // below) is keyed by id — built once alongside the recursive columnDef
    // build so both stay in sync with however `columns` is nested this render.
    const groupHeaderStyles = useMemo(() => {
        const styles: Record<string, CSSProperties> = {}
        for (const col of columns) {
            if (isGroupColumn(col) && col.headerCellStyle) styles[col.id] = col.headerCellStyle
        }
        return styles
    }, [columns])

    const columnDefs = useMemo<ColumnDef<any>[]>(() => {
        const buildLeaf = (col: TableLeafColumnConfig): ColumnDef<any> => ({
            id: col.id,
            ...(col.accessorKey ? { accessorFn: (row: any) => getByPath(row, col.accessorKey!) } : {}),
            enableSorting: !!col.sortable,
            enableColumnFilter: !!col.filterable,
            // Every filterable column is a plain case-insensitive substring
            // match against the stringified value — pinned explicitly so a
            // numeric column doesn't fall back to tanstack's 'auto' default,
            // which would pick `inNumberRange` (expects a [min, max] tuple,
            // not the free-text string our filter inputs actually send).
            ...(col.filterable ? { filterFn: "includesString" as const } : {}),
            // `sortDirection`/`sortIndicator`/`toggleSort` and
            // `filterValue`/`setFilter` are reserved within a header's
            // data/actions namespace the same way `value`/`row`/`rowIndex`
            // are for cells below.
            header: (ctx: any) => {
                const sortDirection: false | "asc" | "desc" = col.sortable ? ctx.column.getIsSorted() : false
                const sortIndicator = !col.sortable ? "" : sortDirection === "asc" ? "▲" : sortDirection === "desc" ? "▼" : "⇅"
                const filterValue: string = col.filterable ? (ctx.column.getFilterValue() as string) ?? "" : ""
                const filterOpen = col.filterable ? openFilterId === col.id : false
                const filterDraft = col.filterable ? filterDrafts[col.id] ?? "" : ""
                // Both `setFilter` and `setFilterDraft` accept a raw string
                // (a user component that already extracted it) or a native
                // change event (a pure-config `<input onChange>`).
                const extractValue = (value: unknown) =>
                    value && typeof value === "object" && "target" in (value as any)
                        ? (value as { target: { value: string } }).target.value
                        : (value as string)
                return (
                    <URRenderer
                        {...col.header}
                        data={{ ...data, sortDirection, sortIndicator, filterValue, filterOpen, filterDraft }}
                        actions={{
                            ...actions,
                            ...(col.sortable ? { toggleSort: () => ctx.column.toggleSorting() } : {}),
                            ...(col.filterable
                                ? {
                                      setFilter: (value: unknown) => ctx.column.setFilterValue(extractValue(value)),
                                      toggleFilterOpen: () => {
                                          setOpenFilterId((cur) => (cur === col.id ? null : col.id))
                                          setFilterDrafts((prev) => ({ ...prev, [col.id]: (ctx.column.getFilterValue() as string) ?? "" }))
                                      },
                                      setFilterDraft: (value: unknown) =>
                                          setFilterDrafts((prev) => ({ ...prev, [col.id]: extractValue(value) })),
                                      applyFilter: () => {
                                          ctx.column.setFilterValue(filterDrafts[col.id] ?? "")
                                          setOpenFilterId(null)
                                      },
                                      cancelFilter: () => setOpenFilterId(null),
                                  }
                                : {}),
                        }}
                    />
                )
            },
            // `value`/`row`/`rowIndex` are reserved within a cell's data
            // namespace for the same reason `style`/`data`/`actions` are
            // reserved at the top level: whatever's spread last wins.
            cell: (ctx: any) => (
                <URRenderer
                    {...col.cell}
                    data={{ ...data, value: ctx.getValue(), row: ctx.row.original, rowIndex: ctx.row.index }}
                    actions={buildRowActions(ctx.row.original, actions, rowActionKeys)}
                />
            ),
        })

        const buildColumn = (col: TableColumnConfig): ColumnDef<any> =>
            isGroupColumn(col)
                ? {
                      id: col.id,
                      header: () => <URRenderer {...col.header} data={{ ...data }} actions={{ ...actions }} />,
                      columns: col.columns.map(buildLeaf),
                  }
                : buildLeaf(col)

        return columns.map(buildColumn)
        // `applyFilter`/`toggleFilterOpen` close over `openFilterId` and
        // `filterDrafts` directly (not via a functional state updater, since
        // `applyFilter` needs to *read* the current draft, not just write to
        // it) — so unlike a plain useCallback, this whole memo must rebuild
        // whenever either changes, or those closures would see stale values.
    }, [columns, data, actions, rowActionKeys, openFilterId, filterDrafts])

    const table = useReactTable({
        data: rows,
        columns: columnDefs,
        getRowId: (row: any) => row[rowId],
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
    })

    return (
        <div style={{ ...DEFAULT_CONTAINER_STYLE, ...containerStyle }}>
            <div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
                <table style={{ width: tableWidth || "100%", ...DEFAULT_TABLE_STYLE, ...tableStyle }}>
                    <colgroup>
                        {columnWidths.map((width, i) => (
                            <col key={leafColumns[i]?.id ?? i} style={{ width }} />
                        ))}
                    </colgroup>
                    <thead>
                        {table.getHeaderGroups().map((headerGroup, rowIndex, allGroups) => {
                            const isLeafRow = rowIndex === allGroups.length - 1
                            let leafIndex = 0
                            return (
                                <tr key={headerGroup.id} style={{ ...DEFAULT_HEADER_ROW_STYLE, ...headerRowStyle }}>
                                    {headerGroup.headers.map((header) => {
                                        // Only the deepest row lines up 1:1 with `leafColumns` (higher
                                        // rows mix group headers with placeholders for ungrouped
                                        // columns) — a group's own override comes from its id instead.
                                        const columnOverride = isLeafRow
                                            ? leafColumns[leafIndex++]?.headerCellStyle
                                            : groupHeaderStyles[header.column.id]
                                        return (
                                            <th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                style={{
                                                    ...DEFAULT_HEADER_CELL_STYLE,
                                                    ...headerCellStyle,
                                                    ...columnOverride,
                                                }}
                                            >
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={leafColumns.length || 1}
                                    style={{ ...DEFAULT_EMPTY_STATE_STYLE, ...emptyStateStyle }}
                                >
                                    {emptyStateText}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={["ur-table-row", rowClassName].filter(Boolean).join(" ")}
                                    style={{ ...DEFAULT_ROW_STYLE, ...rowStyle }}
                                >
                                    {row.getVisibleCells().map((cell, i) => (
                                        <td
                                            key={cell.id}
                                            style={{ ...DEFAULT_CELL_STYLE, ...cellStyle, ...leafColumns[i]?.cellStyle }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Table
