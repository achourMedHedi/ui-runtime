
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
 * `x`/`y`/`w`/`h` are how a node's *parent* places it (as a grid cell span —
 * meaningful whenever that parent is itself `engine: "grid"`) and are
 * carried by every engine for that reason, independent of how the node
 * arranges its *own* children. `engine` only changes the latter:
 * - "grid": children are placed by explicit `x`/`y`/`w`/`h` coordinates
 *   against a `columns`-wide, `rowHeight`-tall track grid (defaults 12/1px).
 * - "flex": children flow in array order along `direction` (default "row"),
 *   no coordinates needed — sized to content by default (no `formatContainerStyle`
 *   height is imposed, unlike grid's explicit-track height), since that's
 *   the whole point of reaching for flex over grid.
 */
export type LayoutConfig =
    | { engine: "grid", columns?: number, rowHeight?: number, x: number, y: number, w: number, h: LayoutConfigGridHeight }
    | {
        engine: "flex",
        direction?: "row" | "column",
        wrap?: boolean,
        gap?: number,
        align?: LayoutConfigFlexAlign,
        justify?: LayoutConfigFlexJustify,
        x: number, y: number, w: number, h: LayoutConfigGridHeight,
    }

type RegisteredComponent<TRegistry extends Record<string, ComponentType<any>>> = {
    [k in keyof TRegistry]: BaseComponent<k, PropsOf<TRegistry[k]>>
}[keyof TRegistry]

type PropsOf<P> = P extends ComponentType<infer prop> ? prop : Record<string, any>

export type BaseComponent<C = string, P = Record<string, any>> = {
    props?: P,
    component: C
}
