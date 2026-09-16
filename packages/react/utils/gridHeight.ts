import type { URLayoutConfig } from "core"

// `h` has the identical shape on every engine (see LayoutConfig), so these
// aren't actually grid-specific despite the name — `useStyle` uses them for
// any node's parent-placement math, and `formatContainerStyle`'s grid branch
// additionally uses `gridRowSpan` for its own track sizing.
type GridHeight = Extract<URLayoutConfig, { engine: "grid" }>["h"]

/**
 * Row-track count `h` occupies (track repeat / total-rows math, and — via
 * useStyle — the `gridRow` span a node occupies in its parent's grid).
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

    // A pure `vh`-relative calc, not `window.innerHeight` math: the old pixel
    // computation ran during render (not an effect), so it threw on the
    // server (no `window`) and — even client-side — baked in a value that
    // went stale the moment the viewport was resized. `vh` is relative by
    // definition, so this is both SSR-safe and correct across resizes.
    const pct = /^screen-(\d+)%$/.exec(h)
    if (pct) return `calc(100vh - ${pct[1]}vh)`

    return undefined
}
