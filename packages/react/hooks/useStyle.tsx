import { useMemo, type CSSProperties } from "react"
import type { URLayoutConfig } from "core"
import { gridExplicitHeight, gridRowSpan } from "../utils/gridHeight.ts"

/**
 * Positions a single component inside its parent's CSS grid.
 */
const useStyle = (layout: URLayoutConfig): CSSProperties => {
    return useMemo(() => {
        if (layout.engine === "grid") {
            const height = gridExplicitHeight(layout.h)
            return {
                gridColumn: `${layout.x + 1} / span ${layout.w}`,
                gridRow: `${layout.y + 1} / span ${gridRowSpan(layout.h)}`,
                ...(height ? { height } : {}),
                overflow: "hidden",
            }
        }
        return {}
    }, [layout])
}


export default useStyle
