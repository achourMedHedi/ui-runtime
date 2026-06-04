import { Cell, ColumnDef, ColumnFiltersState, createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, Header, HeaderGroup, Row, SortingState, Table, Updater, useReactTable, VisibilityState } from "@tanstack/react-table"
import { FC, HTMLAttributes, memo, useMemo, useRef } from "react"
import Runtime from "../../index"
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
        size: number,
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
    let tableWidth = (tableContainerRef.current?.getBoundingClientRect().width ?? 0) - 4

    const tableColumns = useMemo(() => {
        const totalSize = columns.reduce((acc, column) => {
            acc += Number(column.size) || 0
            return acc
        }, 0)
        const numberOfUndefinedColumns = columns.filter((column) => column.size === undefined).length
        let defaultSize = ((tableWidth ?? 0) - totalSize) / (numberOfUndefinedColumns || 1)

        return columns.map((column) => {
            return columnHelper.accessor(column.path, {
                id: column.path || "coolumn.path",
                size: column.size || defaultSize,
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
    }, [columns, tableWidth])

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
    const visibleColumnsTable = table.getVisibleLeafColumns()

    const columnVirtualizer = useVirtualizer<
        HTMLDivElement,
        HTMLTableCellElement
    >({
        count: visibleColumnsTable.length,
        estimateSize: (index) => visibleColumnsTable[index].getSize(), //estimate width of each column for accurate scrollbar dragging
        getScrollElement: () => tableContainerRef.current,
        horizontal: true,
        overscan: 3, //how many columns to render on each side off screen each way (adjust this for performance)
    })

    const virtualColumns = columnVirtualizer.getVirtualItems()

    let virtualPaddingLeft: number | undefined
    let virtualPaddingRight: number | undefined

    if (columnVirtualizer && virtualColumns?.length) {
        virtualPaddingLeft = virtualColumns[0]?.start ?? 0
        virtualPaddingRight =
            columnVirtualizer.getTotalSize() -
            (virtualColumns[virtualColumns.length - 1]?.end ?? 0)
    }

    return (
        <div
            ref={tableContainerRef}
            style={{ overflow: "auto", ...style }}
            className={className + " overflow-auto  "}
        >
            <div style={{ width: table.getTotalSize(), minHeight: "100%" }}>
                <table className="grid table-fixed ">
                    <TableHead
                        columnVirtualizer={columnVirtualizer}
                        table={table}
                        virtualPaddingLeft={virtualPaddingLeft}
                        virtualPaddingRight={virtualPaddingRight}
                    />

                    <TableBody
                        columnVirtualizer={columnVirtualizer}
                        table={table}
                        tableContainerRef={tableContainerRef as React.RefObject<HTMLDivElement>}
                        virtualPaddingLeft={virtualPaddingLeft}
                        virtualPaddingRight={virtualPaddingRight}
                    />
                </table>
            </div>
        </div>

    )
}

interface TableHeadProps {
    columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
    table: Table<any>
    virtualPaddingLeft: number | undefined
    virtualPaddingRight: number | undefined
}

function TableHead({
    columnVirtualizer,
    table,
    virtualPaddingLeft,
    virtualPaddingRight,
}: TableHeadProps) {
    return (
        <thead
            style={{
                display: 'grid',
                position: 'sticky',
                top: 0,
                zIndex: 1,
            }}
        >
            {table.getHeaderGroups().map((headerGroup) => (
                <TableHeadRow
                    columnVirtualizer={columnVirtualizer}
                    headerGroup={headerGroup}
                    key={headerGroup.id}
                    virtualPaddingLeft={virtualPaddingLeft}
                    virtualPaddingRight={virtualPaddingRight}
                />
            ))}
        </thead>
    )
}


interface TableHeadRowProps {
    columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
    headerGroup: HeaderGroup<any>
    virtualPaddingLeft: number | undefined
    virtualPaddingRight: number | undefined
}

function TableHeadRow({
    columnVirtualizer,
    headerGroup,
    virtualPaddingLeft,
    virtualPaddingRight,
}: TableHeadRowProps) {
    const virtualColumns = columnVirtualizer.getVirtualItems()
    return (
        <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
            {virtualPaddingLeft ? (
                //fake empty column to the left for virtualization scroll padding
                <th style={{ display: 'flex', width: virtualPaddingLeft }} />
            ) : null}
            {virtualColumns.map((virtualColumn) => {
                const header = headerGroup.headers[virtualColumn.index]
                return <TableHeadCell key={header.id} header={header} />
            })}
            {virtualPaddingRight ? (
                //fake empty column to the right for virtualization scroll padding
                <th style={{ display: 'flex', width: virtualPaddingRight }} />
            ) : null}
        </tr>
    )
}


interface TableHeadCellProps {
    header: Header<any, unknown>
}

function TableHeadCell({ header }: TableHeadCellProps) {
    return (
        <th
            key={header.id}
            style={{
                display: 'flex',
                width: header.getSize(),
                textAlign: 'left',
            }}
        >
            {flexRender(header.column.columnDef.header, header.getContext())}

            {/* <div
          {...{
            className: header.column.getCanSort()
              ? 'cursor-pointer select-none w-full'
              : 'w-full',
            onClick: header.column.getToggleSortingHandler(),
          }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div> */}
        </th>
    )
}

interface TableBodyRowProps {
    columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
    row: Row<any>
    rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>
    virtualPaddingLeft: number | undefined
    virtualPaddingRight: number | undefined
    virtualRow: VirtualItem
}

function TableBodyRow({
    columnVirtualizer,
    row,
    rowVirtualizer,
    virtualPaddingLeft,
    virtualPaddingRight,
    virtualRow,
}: TableBodyRowProps) {
    const visibleCells = row.getVisibleCells()
    const virtualColumns = columnVirtualizer.getVirtualItems()
    return (
        <tr
            data-index={virtualRow.index} //needed for dynamic row height measurement
            ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
            key={row.id}
            style={{
                display: 'flex',
                position: 'absolute',
                transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                width: '100%',
            }}
        >
            {virtualPaddingLeft ? (
                //fake empty column to the left for virtualization scroll padding
                <td style={{ display: 'flex', width: virtualPaddingLeft }} />
            ) : null}
            {virtualColumns.map((vc) => {
                const cell = visibleCells[vc.index]
                return <TableBodyCell key={cell.id} cell={cell} />
            })}
            {virtualPaddingRight ? (
                //fake empty column to the right for virtualization scroll padding
                <td style={{ display: 'flex', width: virtualPaddingRight }} />
            ) : null}
        </tr>
    )
}


interface TableBodyCellProps {
    cell: Cell<any, unknown>
}

function TableBodyCell({ cell }: TableBodyCellProps) {
    return (
        <td
            key={cell.id}
            style={{
                display: 'flex',
                width: cell.column.getSize(),
            }}
        >
            <div className="w-full">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
        </td>
    )
}

interface TableBodyProps {
    columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
    table: Table<any>
    tableContainerRef: React.RefObject<HTMLDivElement>
    virtualPaddingLeft: number | undefined
    virtualPaddingRight: number | undefined
}

function TableBody({
    columnVirtualizer,
    table,
    tableContainerRef,
    virtualPaddingLeft,
    virtualPaddingRight,
}: TableBodyProps) {
    const { rows } = table.getRowModel()

    //dynamic row height virtualization - alternatively you could use a simpler fixed row height strategy without the need for `measureElement`
    const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
        count: rows.length,
        estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
        getScrollElement: () => tableContainerRef.current,
        //measure dynamic row height, except in firefox because it measures table border height incorrectly
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
                height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
                position: 'relative', //needed for absolute positioning of rows
            }}
        >
            {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<any>

                return (
                    <TableBodyRow
                        columnVirtualizer={columnVirtualizer}
                        key={row.id}
                        row={row}
                        rowVirtualizer={rowVirtualizer}
                        virtualPaddingLeft={virtualPaddingLeft}
                        virtualPaddingRight={virtualPaddingRight}
                        virtualRow={virtualRow}
                    />
                )
            })}
        </tbody>
    )
}

export default ReactTable