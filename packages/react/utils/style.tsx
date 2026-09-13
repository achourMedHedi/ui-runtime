import { CSSProperties } from "react"
import { URComponentConfig, URLayoutConfig } from "core"
import { gridRowSpan } from "./gridHeight.ts"

/**
 * Turns a container's own layout into a CSS grid definition sized to fit
 * its children's layouts (columns from `layout.columns`, rows tall enough
 * to cover every child's `y + h`).
 */
export const formatGridContainerStyle = (layout: URLayoutConfig, children?: URComponentConfig[]): CSSProperties => {
    if (layout.engine !== "grid") return {}

    const rowHeight = layout.rowHeight ?? 1
    const hasChildren = Array.isArray(children) && children.length > 0
    const totalRows = hasChildren
        ? children!.reduce((max, child) => Math.max(max, child.layout.y + gridRowSpan(child.layout.h)), gridRowSpan(layout.h))
        : gridRowSpan(layout.h)

    const base: CSSProperties = {
        width: "100%",
        height: `${totalRows * rowHeight}px`,
        boxSizing: "border-box",
    }

    // Leaf components (no nested children to arrange) keep their own native
    // rendering (e.g. a <button>'s built-in text centering) — forcing
    // display:grid on them only ever helps actual grid parents.
    if (!hasChildren) return base

    const columns = layout.columns ?? 12
    return {
        ...base,
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${totalRows}, ${rowHeight}px)`,
    }
}