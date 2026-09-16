import { useMemo, type CSSProperties } from "react"
import type { URLayoutConfig } from "core"
import { gridExplicitHeight, gridRowSpan } from "../utils/gridHeight.ts"

/**
 * Positions a single component inside its parent's CSS grid, using its own
 * `x`/`y`/`w`/`h` (only `grid`-engine nodes carry those — see LayoutConfig,
 * a flex node can never be positioned by a grid parent by design, since it
 * has no coordinates to be placed with). `gridColumn`/`gridRow` are simply
 * inert when the parent isn't itself `display: grid`, same as they always
 * were — this doesn't need to know or care what the parent's engine is.
 */
const useStyle = (layout: URLayoutConfig): CSSProperties => {
    return useMemo(() => {
        if (layout.engine !== "grid") return { overflow: "hidden" }

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
