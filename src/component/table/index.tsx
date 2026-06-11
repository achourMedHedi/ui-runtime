import { Cell, ColumnFiltersState, createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Header, HeaderGroup, Row, SortingState, Table, Updater, useReactTable, VisibilityState } from "@tanstack/react-table"
import { FC, memo, useMemo, useRef } from "react"
import Runtime from "../../Runtime"
import { ComponentConfig } from "../../types"
import {
    useVirtualizer,
    VirtualItem,
    Virtualizer,
} from '@tanstack/react-virtual'

type TableProps = {
    className?: string,
    rows: any[],
    columns: {
        size?: number,
        path: string,
        key: string,
        header: ComponentConfig,
        cell: ComponentConfig,
        enableSorting?: boolean,
    }[],
    columnFilter: ColumnFiltersState,
    columnSort: SortingState,
    visibleColumns: VisibilityState,
    style?: React.CSSProperties,
    onColumnFilter?: (filter: Updater<ColumnFiltersState>) => void,
    onSortingChange?: (sort: Updater<SortingState>) => void,
    data: Record<string, any>,
    actions: Record<string, any>,
    customComponents: Record<string, ComponentConfig>
}

function shallowEqual(a: Record<string, any>, b: Record<string, any>): boolean {
    if (a === b) return true
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    for (const k of keysA) {
        if (!(k in b) || a[k] !== b[k]) return false
    }
    return true
}

type HeaderRuntimeProps = {
    header: Header<any, unknown>
    column: TableProps["columns"][number]
    data: Record<string, any>
    actions: Record<string, any>
    customComponents: Record<string, ComponentConfig>
    globalProps: Record<string, any>
}

const TableHeaderRuntime = memo(function TableHeaderRuntime({
    header,
    column,
    data,
    actions,
    customComponents,
    globalProps,
}: HeaderRuntimeProps) {
    const resolvedActions = useMemo(() => {
        const next: Record<string, any> = {}
        for (const [key, value] of Object.entries(actions)) {
            next[key] = (...args: any[]) => (value as (...args: any[]) => void)(header, ...args)
        }
        next.sortBy = header.column.getToggleSortingHandler()
        return next
    }, [header, actions])
    const resolvedData = useMemo(
        () => ({ ...data, columnSort: header.column.getIsSorted() }),
        [data, header.column.getIsSorted()]
    )
    return (
        <Runtime
            {...customComponents[column.header?.customComponent!]}
            customComponents={customComponents}
            data={resolvedData}
            actions={resolvedActions}
            globalProps={globalProps}
        />
    )
}, function headerRuntimeEqual(prev, next) {
    if (prev.header !== next.header || prev.column !== next.column) return false
    if (prev.customComponents !== next.customComponents) return false
    if (!shallowEqual(prev.globalProps || {}, next.globalProps || {})) return false
    if (prev.actions !== next.actions) return false
    const prevData = { ...prev.data, columnSort: prev.header.column.getIsSorted() }
    const nextData = { ...next.data, columnSort: next.header.column.getIsSorted() }
    return shallowEqual(prevData, nextData)
})

type CellRuntimeProps = {
    cellColumn: TableProps["columns"][number]
    row: Row<any>
    actions: Record<string, any>
    customComponents: Record<string, ComponentConfig>
    globalProps: Record<string, any>
}

const TableCellRuntime = memo(function TableCellRuntime({
    cellColumn,
    row,
    actions,
    customComponents,
    globalProps,
}: CellRuntimeProps) {
    const cellValue = row.getValue(cellColumn.path)
    const resolvedData = useMemo(
        () => ({ ...row.original, value: cellValue }),
        [row.original, cellValue, cellColumn.path]
    )
    const resolvedGlobalProps = useMemo(
        () => ({ ...row.original, value: cellValue, ...globalProps }),
        [row.original, cellValue, globalProps]
    )
    const resolvedActions = useMemo(
        () => ({
            ...actions,
            getRowData: () => (actions as any).getRowData?.(row.original) ?? row.original,
        }),
        [actions, row.original]
    )
    return (
        <Runtime
            {...customComponents[cellColumn.cell?.customComponent!]}
            customComponents={customComponents}
            data={resolvedData}
            actions={resolvedActions}
            globalProps={resolvedGlobalProps}
        />
    )
}, function cellRuntimeEqual(prev, next) {
    if (prev.cellColumn !== next.cellColumn || prev.row !== next.row) return false
    if (prev.customComponents !== next.customComponents) return false
    if (!shallowEqual(prev.globalProps || {}, next.globalProps || {})) return false
    if (prev.actions !== next.actions) return false
    return true
})

const columnHelper = createColumnHelper<any>()

const ReactTable: FC<TableProps> = ({ style, rows, columns, columnFilter, columnSort, visibleColumns, className, onColumnFilter, onSortingChange, data, actions, customComponents }) => {
    if (!columns || !rows || !columnSort || !onSortingChange) return null
    const tableContainerRef = useRef<HTMLDivElement>(null)
    const dataRef = useRef(data)
    const actionsRef = useRef(actions)
    const customComponentsRef = useRef(customComponents)
    dataRef.current = data
    actionsRef.current = actions
    customComponentsRef.current = customComponents

    const tableColumns = useMemo(() => {
        return columns.map((column) => {
            return columnHelper.accessor(column.path, {
                id: column.path || "column.path",
                size: column.size,
                header: (headerContext) => (
                    <TableHeaderRuntime
                        header={headerContext.header}
                        column={column}
                        data={dataRef.current}
                        actions={actionsRef.current}
                        customComponents={customComponentsRef.current}
                        globalProps={column.header?.globalProps || {}}
                    />
                ),
                cell: ({ row }) => (
                    <TableCellRuntime
                        cellColumn={column}
                        row={row}
                        actions={actionsRef.current}
                        customComponents={customComponentsRef.current}
                        globalProps={column.cell?.globalProps || {}}
                    />
                ),
                enableSorting: column.enableSorting ?? false,
            })
        })
    }, [columns])

    const table = useReactTable({
        data: rows,
        columns: tableColumns,
        state: {
            columnFilters: columnFilter,
            sorting: columnSort,
            columnVisibility: visibleColumns
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: onColumnFilter,
        onSortingChange: onSortingChange,
        getSortedRowModel: getSortedRowModel(),
        enableHiding: true,
    })

    const gridTemplateColumns = useMemo(() => {
        return columns.map(col => col.size ? `${col.size}px` : '1fr').join(' ')
    }, [columns])

    return (
        <div
            ref={tableContainerRef}
            style={{ overflow: "auto", ...style }}
            className={className + " overflow-auto"}
        >
            <div style={{ width: '100%', minHeight: '100%' }}>
                <table className="grid table-fixed w-full">
                    <TableHead
                        table={table}
                        gridTemplateColumns={gridTemplateColumns}
                    />
                    <TableBody
                        table={table}
                        tableContainerRef={tableContainerRef as React.RefObject<HTMLDivElement>}
                        gridTemplateColumns={gridTemplateColumns}
                    />
                </table>
            </div>
        </div>
    )
}

interface TableHeadProps {
    table: Table<any>
    gridTemplateColumns: string
}

function TableHead({ table, gridTemplateColumns }: TableHeadProps) {
    return (
        <thead style={{ display: 'grid', position: 'sticky', top: 0, zIndex: 1 }}>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableHeadRow
                    headerGroup={headerGroup}
                    key={headerGroup.id}
                    gridTemplateColumns={gridTemplateColumns}
                />
            ))}
        </thead>
    )
}

interface TableHeadRowProps {
    headerGroup: HeaderGroup<any>
    gridTemplateColumns: string
}

function TableHeadRow({ headerGroup, gridTemplateColumns }: TableHeadRowProps) {
    return (
        <tr key={headerGroup.id} style={{ display: 'grid', gridTemplateColumns, width: '100%' }}>
            {headerGroup.headers.map((header) => (
                <TableHeadCell key={header.id} header={header} />
            ))}
        </tr>
    )
}

interface TableHeadCellProps {
    header: Header<any, unknown>
}

function TableHeadCell({ header }: TableHeadCellProps) {
    return (
        <th key={header.id} style={{ textAlign: 'left', overflow: 'hidden', minWidth: 0 }}>
            {flexRender(header.column.columnDef.header, header.getContext())}
        </th>
    )
}

interface TableBodyRowProps {
    row: Row<any>
    rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
    virtualRow: VirtualItem
    gridTemplateColumns: string
}

function TableBodyRow({ row, rowVirtualizer, virtualRow, gridTemplateColumns }: TableBodyRowProps) {
    const visibleCells = row.getVisibleCells()
    return (
        <tr
            data-index={virtualRow.index}
            ref={(node) => rowVirtualizer.measureElement(node)}
            key={row.id}
            style={{
                display: 'grid',
                gridTemplateColumns,
                position: 'absolute',
                transform: `translateY(${virtualRow.start}px)`,
                width: '100%',
            }}
        >
            {visibleCells.map((cell) => (
                <TableBodyCell key={cell.id} cell={cell} />
            ))}
        </tr>
    )
}

interface TableBodyCellProps {
    cell: Cell<any, unknown>
}

function TableBodyCell({ cell }: TableBodyCellProps) {
    return (
        <td key={cell.id} style={{ overflow: 'hidden', minWidth: 0 }}>
            <div className="w-full">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
        </td>
    )
}

interface TableBodyProps {
    table: Table<any>
    tableContainerRef: React.RefObject<HTMLDivElement>
    gridTemplateColumns: string
}

function TableBody({ table, tableContainerRef, gridTemplateColumns }: TableBodyProps) {
    const { rows } = table.getRowModel()

    const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
        count: rows.length,
        estimateSize: () => 33,
        getScrollElement: () => tableContainerRef.current,
        measureElement:
            typeof window !== 'undefined' &&
                navigator.userAgent.indexOf('Firefox') === -1
                ? (element) => element?.getBoundingClientRect().height
                : undefined,
        overscan: 5,
    })

    const virtualRows = rowVirtualizer.getVirtualItems()

    return (
        <tbody
            style={{
                display: 'grid',
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
            }}
        >
            {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<any>
                return (
                    <TableBodyRow
                        key={row.id}
                        row={row}
                        rowVirtualizer={rowVirtualizer}
                        virtualRow={virtualRow}
                        gridTemplateColumns={gridTemplateColumns}
                    />
                )
            })}
        </tbody>
    )
}

export default ReactTable
