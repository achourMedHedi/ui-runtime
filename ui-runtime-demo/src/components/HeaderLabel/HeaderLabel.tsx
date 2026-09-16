import { useEffect, useLayoutEffect, useRef, useState, type FC } from "react"
import { createPortal } from "react-dom"

type HeaderLabelProps = {
    label?: string
    // Wired straight from the Table's per-column sort namespace (see
    // Table.tsx): `"sortDirection": "{{data.sortDirection}}"` /
    // `"onSortToggle": "{{actions.toggleSort}}"`. The indicator glyph and the
    // click handling both live inside this component — the app owner just
    // hands it the raw sort state instead of composing the UI from config.
    sortDirection?: false | "asc" | "desc"
    onSortToggle?: () => void
    // Same idea, for filtering: `"filterValue": "{{data.filterValue}}"` /
    // `"onFilterChange": "{{actions.setFilter}}"`. Unlike Table's own
    // popover primitives (filterOpen/filterDraft/toggleFilterOpen/...), this
    // component never touches those — it owns its open/draft state and the
    // portal entirely itself, and only calls `onFilterChange` once, when
    // "Search" is clicked. The config's contract never changed even though
    // the UI went from an always-visible input to an icon + popover.
    filterValue?: string
    onFilterChange?: (value: string) => void
    // injected automatically by the runtime (see UiRuntime.tsx) — unused here
    data?: unknown
    actions?: unknown
}

// A custom, registered component used directly as a Table header's
// `component` — the counterpart to the plain-config `Container`/`Button`
// header, proving a column's header can hand off to whatever the app owner
// registers instead of raw config, just like CategoryBadge does for cells.
const HeaderLabel: FC<HeaderLabelProps> = ({ label = "", sortDirection, onSortToggle, filterValue, onFilterChange }) => {
    const sortable = typeof onSortToggle === "function"
    const filterable = typeof onFilterChange === "function"
    const filterActive = !!filterValue

    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState(filterValue ?? "")
    const anchorRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState<{ top: number; right: number } | null>(null)

    useLayoutEffect(() => {
        if (!open || !anchorRef.current) return
        const rect = anchorRef.current.getBoundingClientRect()
        setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }, [open])

    useEffect(() => {
        if (!open) return
        const handlePointerDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
            setOpen(false)
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("mousedown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("mousedown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open])

    const openPopover = () => {
        setDraft(filterValue ?? "")
        setOpen(true)
    }
    const apply = () => {
        onFilterChange?.(draft)
        setOpen(false)
    }
    const cancel = () => setOpen(false)

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
                onClick={onSortToggle}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    cursor: sortable ? "pointer" : undefined,
                    userSelect: sortable ? "none" : undefined,
                }}
            >
                {label}
                {sortable && (
                    <span aria-hidden style={{ fontSize: 9, opacity: sortDirection ? 1 : 0.4 }}>
                        {sortDirection === "asc" ? "▲" : sortDirection === "desc" ? "▼" : "⇅"}
                    </span>
                )}
            </span>

            {filterable && (
                <button
                    ref={anchorRef}
                    type="button"
                    onClick={openPopover}
                    aria-label="Filter"
                    style={{
                        marginLeft: "auto",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: 1,
                        padding: 2,
                        flexShrink: 0,
                        opacity: filterActive ? 1 : 0.5,
                    }}
                >
                    🔍
                </button>
            )}

            {filterable &&
                open &&
                coords &&
                createPortal(
                    <div
                        ref={panelRef}
                        style={{
                            position: "fixed",
                            top: coords.top,
                            right: coords.right,
                            zIndex: 1000,
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                            padding: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            width: 160,
                            textTransform: "none",
                            letterSpacing: 0,
                        }}
                    >
                        <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && apply()}
                            placeholder="Filter…"
                            style={{
                                fontSize: 12,
                                padding: "4px 6px",
                                border: "1px solid #e5e7eb",
                                borderRadius: 6,
                                outline: "none",
                                width: "100%",
                                boxSizing: "border-box",
                            }}
                        />
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={cancel}
                                style={{
                                    fontSize: 11,
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    border: "1px solid #e5e7eb",
                                    background: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={apply}
                                style={{
                                    fontSize: 11,
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: "#4f46e5",
                                    color: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                Search
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    )
}

export default HeaderLabel
