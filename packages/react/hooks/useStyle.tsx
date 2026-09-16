import { useMemo, type CSSProperties } from "react"
import type { URLayoutConfig } from "core"
import { gridExplicitHeight, gridRowSpan } from "../utils/gridHeight.ts"

/**
 * Positions a single component inside its parent's CSS grid — every engine
 * carries `x`/`y`/`w`/`h` for exactly this reason (see LayoutConfig), so this
 * runs the same regardless of how the node arranges *its own* children.
 * `gridColumn`/`gridRow` are simply inert when the parent isn't itself
 * `display: grid` (e.g. a flex parent), same as they always were.
 */
const useStyle = (layout: URLayoutConfig): CSSProperties => {
    return useMemo(() => {
        const height = gridExplicitHeight(layout.h)
        return {
            gridColumn: `${layout.x + 1} / span ${layout.w}`,
            gridRow: `${layout.y + 1} / span ${gridRowSpan(layout.h)}`,
            ...(height ? { height } : {}),
            overflow: "hidden",
        }
    }, [layout])
}


export default useStyle
