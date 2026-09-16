
/**
 * a minimal stand-in for React.FC so core stays framework-agnostic
 */
export type ComponentType<P = any> = (props: P) => any

/**
 * the user need to provide some context and setting for the UiRuntime to be configured like
 */
export type RuntimeContext<TRegistry extends Record<string, ComponentType<any>> = Record<string, ComponentType<any>>> = {
    // pre build component to inject 
    components: TRegistry
    version?: "0.1.0"
}


/**
 * the user will be able to pass the component
 * - position (x,y,w,h) 
 * - component name
 * - props
 *   
 */
export type ComponentConfig<TRegistry extends Record<string, ComponentType<any>> = Record<string, ComponentType<any>>> =
    | RegisteredComponent<TRegistry> & {
        /**
         * uniq id uuid
         */
        id: string,
        layout: LayoutConfig,
        visibleWhen?: ComponentVisibleWhen,

        data?: InjectableData,
        actions?: InjectableActions,
        style?: CSSStyleProperties
    }

export type CSSStyleProperties = Record<string, string | number>

export type InjectableData = {
    [key: string]: any
}

export type InjectableActions = {
    [key: string]: Function
}

type ComponentVisibleWhen = {
    ref: string,
    equals?: any,
    notEquals?: any,
    isEmpty?: boolean,
}

type LayoutConfigGridHeight = number | "screen" | `screen-${number}px` | `screen-${number}%`

type LayoutConfigFlexAlign = "start" | "center" | "end" | "stretch" | "baseline"
type LayoutConfigFlexJustify = "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly"

/**
 * "grid": children are placed by explicit `x`/`y`/`w`/`h` coordinates against
 * a `columns`-wide, `rowHeight`-tall track grid (defaults 12/1px) — and,
 * since a node's *parent* also places *it* the same way, every grid node
 * carries `x`/`y`/`w`/`h` for that reason too, independent of how it
 * arranges its own children.
 *
 * "flex": children flow in array order along `direction` (default "row"),
 * sized to content — no coordinates needed, no `x`/`y`/`w`/`h` on this
 * variant at all. That means a flex node can never be positioned by a grid
 * parent (nothing to place it with) — a deliberate constraint, not an
 * oversight: audited every flex node in this project's own demo config and
 * found the one node that genuinely needed grid-parent placement was better
 * served by staying `engine: "grid"` and reaching for a `props.style`
 * override for its own flex *rendering* instead. See that config for the
 * pattern if you hit the same case.
 */
export type LayoutConfig =
    | { engine: "grid", columns?: number, rowHeight?: number, x: number, y: number, w: number, h: LayoutConfigGridHeight }
    | { engine: "flex", direction?: "row" | "column", wrap?: boolean, gap?: number, align?: LayoutConfigFlexAlign, justify?: LayoutConfigFlexJustify }

type RegisteredComponent<TRegistry extends Record<string, ComponentType<any>>> = {
    [k in keyof TRegistry]: BaseComponent<k, PropsOf<TRegistry[k]>>
}[keyof TRegistry]

type PropsOf<P> = P extends ComponentType<infer prop> ? prop : Record<string, any>

export type BaseComponent<C = string, P = Record<string, any>> = {
    props?: P,
    component: C
}
