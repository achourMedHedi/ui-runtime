import type { URLayoutConfig } from "core"

type GridHeight = Extract<URLayoutConfig, { engine: "grid" }>["h"]

/**
 * Row-track count `h` occupies for grid sizing (track repeat / total-rows math).
 * Screen-relative heights only reserve a single track and grow past it via
 * an explicit CSS height, so they don't inflate the grid's row count.
 */
export const gridRowSpan = (h: GridHeight): number => (typeof h === "number" ? h : 1)

/** Explicit CSS height for screen-relative `h` values, or undefined for plain row counts. */
export const gridExplicitHeight = (h: GridHeight): string | undefined => {
    if (typeof h === "number") return undefined
    if (h === "screen") return "100vh"

    const px = /^screen-(\d+)px$/.exec(h)
    if (px) return `calc(100vh - ${px[1]}px)`

    const pct = /^screen-(\d+)%$/.exec(h)
    if (pct) return `calc(100vh - ${window.innerHeight * parseFloat(pct[1]) / 100}px)`

    return undefined
}
