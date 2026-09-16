import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FC } from "react"
import { createPortal } from "react-dom"
import { URRenderer, type URComponentConfig } from "../../../../packages/react/index.tsx"

type PortalPlacement = "anchor" | "center" | "custom"
type PortalAlign = "start" | "end"

type PortalProps = {
    open?: boolean
    // called on outside click / Escape / backdrop click — NOT on every
    // close (e.g. a config's own "Cancel"/"Search" buttons close by
    // flipping `open` themselves); this is only for dismissal Portal
    // detects on its own.
    onClose?: () => void
    // How the panel is positioned — this is what keeps Portal a generic
    // primitive instead of hardwired to "popover under a trigger icon":
    //   "anchor" (default) — positioned under the trigger, hugging its
    //     `align` edge. A popover/dropdown/filter menu.
    //   "center" — centered in the viewport, ignoring the trigger. A modal.
    //   "custom" — Portal adds no position at all; the panel node's own
    //     top-level `style` must set its own `position` (e.g. a toast
    //     pinned to a screen corner, or an anchored-but-offset tooltip).
    placement?: PortalPlacement
    // "anchor" placement only — which edge of the trigger the panel hugs.
    align?: PortalAlign
    // "anchor" placement only — gap between trigger and panel, in px.
    gap?: number
    zIndex?: number
    // Renders a full-viewport dimmed layer behind the panel; clicking it
    // closes, same as a modal's backdrop. Off by default — a popover
    // doesn't want one, a modal usually does.
    backdrop?: boolean
    backdropStyle?: CSSProperties
    // Outside click / Escape auto-close. Off lets a caller require an
    // explicit close action instead (e.g. a blocking confirmation).
    dismissible?: boolean
    // exactly two entries: [trigger, panel]. The trigger renders inline, in
    // place, like any other node. The panel only mounts — via a real DOM
    // portal into document.body — while `open`, so it escapes any
    // `overflow: hidden` / `position: sticky` ancestor (e.g. a table header
    // cell) without shifting surrounding layout. The panel node's own
    // top-level `style` controls all of its decoration (background, border,
    // shadow, width, ...) exactly like any other config node — Portal only
    // ever adds *placement*, never look.
    children?: URComponentConfig[]
    // injected automatically by the runtime (see UiRuntime.tsx) — unused
    // here directly; nested children still inherit it via context as usual.
    data?: unknown
    actions?: unknown
}

const DEFAULT_BACKDROP_STYLE: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.4)",
}

// A generic, use-case-agnostic building block — the pure-config counterpart
// to a user component that would just call `ReactDOM.createPortal` itself
// (see HeaderLabel's own filter popover). Registering this once lets any
// JSON config open a positioned overlay — popover, modal, toast, whatever
// `placement`/`backdrop` combination fits — without a dedicated component.
const Portal: FC<PortalProps> = ({
    open = false,
    onClose,
    placement = "anchor",
    align = "end",
    gap = 6,
    zIndex = 1000,
    backdrop = false,
    backdropStyle,
    dismissible = true,
    children = [],
}) => {
    const anchorRef = useRef<HTMLSpanElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null)
    // `createPortal(..., document.body)` runs during render, not an effect —
    // `document` doesn't exist during SSR, and even client-side the very
    // first render (before hydration) must match what the server sent.
    // Deferring the portal to "mounted" (an effect, so it's a no-op on the
    // server and fires just after hydration on the client) keeps both sides
    // in sync and avoids a hard SSR crash.
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const [trigger, panel] = children

    useLayoutEffect(() => {
        if (!open || placement !== "anchor" || !anchorRef.current) return
        const rect = anchorRef.current.getBoundingClientRect()
        setCoords(
            align === "start"
                ? { top: rect.bottom + gap, left: rect.left }
                : { top: rect.bottom + gap, right: window.innerWidth - rect.right }
        )
    }, [open, placement, align, gap])

    useEffect(() => {
        if (!open || !dismissible) return
        const handlePointerDown = (e: MouseEvent) => {
            const target = e.target as Node
            if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
            onClose?.()
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose?.()
        }
        document.addEventListener("mousedown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("mousedown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open, dismissible, onClose])

    const positionStyle: CSSProperties =
        placement === "center"
            ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex }
            : placement === "anchor"
              ? { position: "fixed", top: coords?.top, left: coords?.left, right: coords?.right, zIndex }
              : // "custom" — no positioning at all; the panel's own config-driven
                // style is entirely responsible for it.
                {}

    const ready = placement !== "anchor" || coords !== null
    const showPanel = mounted && open && panel && ready

    return (
        <>
            <span ref={anchorRef} style={{ display: "inline-flex" }}>
                {trigger && <URRenderer key={trigger.id} {...trigger} />}
            </span>
            {showPanel &&
                createPortal(
                    <>
                        {backdrop && (
                            <div onClick={onClose} style={{ ...DEFAULT_BACKDROP_STYLE, zIndex: zIndex - 1, ...backdropStyle }} />
                        )}
                        <div ref={panelRef} style={positionStyle}>
                            <URRenderer key={panel.id} {...panel} />
                        </div>
                    </>,
                    document.body
                )}
        </>
    )
}

export default Portal
