import { CSSProperties } from "react"
import { URComponentConfig, URLayoutConfig } from "core"
import { gridRowSpan } from "./gridHeight.ts"

const FLEX_ALIGN: Record<string, CSSProperties["alignItems"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
    baseline: "baseline",
}

const FLEX_JUSTIFY: Record<string, CSSProperties["justifyContent"]> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    "space-between": "space-between",
    "space-around": "space-around",
    "space-evenly": "space-evenly",
}

/**
 * Turns a container's own layout into the CSS for arranging *its own*
 * children — independent of how the container itself was positioned by its
 * parent (see useStyle); a grid container can itself be a flex child (it
 * just won't be positioned by that parent's arrangement), but not the other
 * way around — a flex node has no `x`/`y`/`w`/`h` to be placed with, so it
 * can never sit as a positioned child of a grid parent (see LayoutConfig).
 *
 * "grid": a definition sized to fit the children (columns from
 * `layout.columns`, rows tall enough to cover every child's `y + h` — only
 * grid children have those, so flex children are skipped in that sum), with
 * an explicit pixel height to match — children are placed at fixed
 * coordinates, so the grid needs to know exactly how tall it is.
 *
 * "flex": a row/column flexbox with no imposed height at all — children
 * flow in array order and the container sizes to its content, which is the
 * whole reason to reach for flex over grid in the first place.
 */
export const formatContainerStyle = (layout: URLayoutConfig, children?: URComponentConfig[]): CSSProperties => {
    const hasChildren = Array.isArray(children) && children.length > 0

    if (layout.engine === "flex") {
        const base: CSSProperties = { width: "100%", boxSizing: "border-box" }
        if (!hasChildren) return base
        return {
            ...base,
            display: "flex",
            flexDirection: layout.direction === "column" ? "column" : "row",
            flexWrap: layout.wrap ? "wrap" : "nowrap",
            ...(layout.gap !== undefined ? { gap: layout.gap } : {}),
            ...(layout.align ? { alignItems: FLEX_ALIGN[layout.align] } : {}),
            ...(layout.justify ? { justifyContent: FLEX_JUSTIFY[layout.justify] } : {}),
        }
    }

    const rowHeight = layout.rowHeight ?? 1
    const totalRows = hasChildren
        ? children!.reduce((max, child) => {
              // a flex child has no y/h to contribute — it isn't placed by
              // this grid at all, so it can't affect how tall the grid is.
              if (child.layout.engine !== "grid") return max
              return Math.max(max, child.layout.y + gridRowSpan(child.layout.h))
          }, gridRowSpan(layout.h))
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
