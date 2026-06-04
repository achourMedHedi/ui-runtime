import type ReactGridLayout from "react-grid-layout"

/**
 * Condition used to control visibility or conditional class names.
 * Evaluated against a data/props/globalProps/state reference.
 *
 * @example
 * // Show only when state.isOpen equals true
 * { ref: "state.isOpen", equals: true }
 *
 * @example
 * // Show only when data.role is not "guest"
 * { ref: "data.role", notEquals: "guest" }
 */
export type VisibleWhen = {
    /** Dot-path reference. Prefix with namespace: `data.`, `props.`, `globalProps.`, `state.` */
    ref: string
    /** Show when value strictly equals this. Supports boolean, string, number. */
    equals?: any
    /** Show when value does NOT equal this. */
    notEquals?: any
    /** Show when value is falsy / empty. */
    isEmpty?: boolean
}

/**
 * Extends VisibleWhen — appends a CSS class string when the condition is met.
 * Multiple rules are evaluated and all matching classes are concatenated.
 *
 * @example
 * [
 *   { ref: "globalProps.isPrimary", equals: true, className: "bg-blue-600 text-white" },
 *   { ref: "globalProps.isPrimary", equals: false, className: "bg-white text-blue-600" }
 * ]
 */
export type ExtraClassNameWhen = VisibleWhen & {
    /** Tailwind or custom class string to append when condition matches. */
    className?: string
}

/**
 * A single inline text segment inside a `text` component's children array.
 * Supports mixed spans, divs, and router links in one text block.
 */
export type BaseChildren = {
    /** The text content. Supports `{{data.*}}`, `{{state.*}}`, `{{globalProps.*}}` bindings. */
    text: string
    /** Rendered element. Defaults to `span`. Use `link` for router navigation. */
    as?: "span" | "div" | "link"
    /** Router path — only used when `as` is `"link"`. */
    link?: string
    /** Tailwind or custom class string for this segment. */
    className?: string
}

/** Events that can trigger a workflow on a component. */
export type WorkflowEvents =
    | "onMount"
    | "onClick"
    | "onChange"

/**
 * Grid position and size for a component node.
 * Uses a CSS grid model where each row is 1px tall and columns are configurable.
 *
 * @example
 * // Full-viewport container with 12 columns
 * { i: "root", x: 0, y: 0, w: 12, h: "screen", totalColumns: 12 }
 *
 * @example
 * // A box starting 100px from the bottom of its parent, 200px tall
 * { i: "footer", x: 0, y: -200, w: 12, h: 200 }
 */
export type Layout = Omit<ReactGridLayout.Layout, "h" | "y"> & {
    /**
     * Height of the component.
     * - `number` — pixel height
     * - `"screen"` — 100vh
     * - `` `screen-${n}` `` — `100vh - n px` (e.g. `"screen-64"` for nav offset)
     */
    h: number | "screen" | `screen-${number}`
    /**
     * Vertical start position in pixels.
     * - `number` — pixel offset from parent top
     * - `"-number"` — offset from parent bottom (e.g. `-48` = 48px from bottom)
     * - `"N%"` — percentage of parent height (e.g. `"50%"`)
     */
    y: number | string
    /**
     * Number of columns in this node's grid.
     * Children use `x` and `w` relative to this column count.
     * Default: `12`. Use higher values (e.g. `96`) for fine-grained placement.
     */
    totalColumns?: number
}

/**
 * A node in the recursive component tree.
 * Every node has a grid position, a component type, props, and optional children via `gridLayout`.
 */
export type GridLayout = Layout & {
    /** Human-readable label — used by editors, not rendered. */
    name?: string
    /**
     * Scoped variables for this subtree.
     * Accessible as `{{globalProps.key}}` in props and children.
     * Per-instance overrides when using custom components.
     */
    globalProps?: Record<string, any>
    /**
     * Key into the `customComponents` map to use a config-template component.
     * When set, `component` is ignored and the template is rendered instead.
     */
    customComponent?: string
    /** Recursive children. Always include — use `[]` for leaf nodes. */
    gridLayout: GridLayout[]
    /**
     * Built-in component type: `div`, `button`, `text`, `input`, `form`,
     * `table`, `modal`, `slot`.
     */
    component: string
    /**
     * Props passed to the component after binding resolution.
     * String values support `{{namespace.path}}` bindings.
     *
     * Supported namespaces: `data`, `actions`, `globalProps`, `props`, `state`
     */
    props: Record<string, any>
    /** Conditionally hide this node. See {@link VisibleWhen}. */
    visibleWhen?: VisibleWhen
    /** Conditionally append CSS classes. See {@link ExtraClassNameWhen}. */
    extraClassNamesWhen?: ExtraClassNameWhen[]
}

type TextComponent = {
    component: "text"
    props: {
        children: BaseChildren[]
        as?: "span" | "div" | "link"
        className?: string
    }
}

type NativeComponent = {
    component: Exclude<string, "text">
    props: Record<string, any> & {
        children?: BaseChildren[] | string
        className?: string
    }
}

/**
 * Root config passed to the `<Runtime>` component.
 * Extends `GridLayout` with page-level data, actions, state, and custom component map.
 *
 * @example
 * ```tsx
 * const config: ComponentConfig = {
 *   i: "root", x: 0, y: 0, w: 12, h: "screen",
 *   component: "div",
 *   props: { className: "bg-gray-50" },
 *   gridLayout: [...]
 * }
 *
 * <Runtime
 *   {...config}
 *   data={{ user: { name: "Alice" } }}
 *   actions={{ onLogout: () => navigate("/login") }}
 *   customComponents={{}}
 * />
 * ```
 */
export type ComponentConfig = Layout & {
    id?: string
    /** Human-readable label — used by editors, not rendered. */
    name?: string
    /**
     * Scoped variables resolved before rendering.
     * Use `{{data.*}}` or `{{actions.*}}` bindings here to create
     * reusable per-instance variables for custom components.
     */
    globalProps?: Record<string, any>
    /** Recursive children. Always include — use `[]` for leaf nodes. */
    gridLayout: GridLayout[]
    /** Current state passed down from a parent state owner. Internal — do not set manually. */
    parentState?: Record<string, any>
    /**
     * Page-level reactive data. Accessible as `{{data.path}}` in any prop or text binding.
     * Pass updated objects to trigger re-renders.
     */
    data?: Record<string, any>
    /**
     * Event handler functions. Accessible as `{{actions.name}}` in props.
     * Action bindings are wrapped so the current state is injected as the first argument.
     */
    actions?: Record<string, any>
    /** Conditionally hide this node. See {@link VisibleWhen}. */
    visibleWhen?: VisibleWhen
    /** Conditionally append CSS classes. See {@link ExtraClassNameWhen}. */
    extraClassNamesWhen?: ExtraClassNameWhen[]
    /** Internal — parent height in px, used for percentage and negative `y` resolution. */
    parentHeight?: number
    /**
     * Key into the `customComponents` map to render a config-template component.
     * When set, `component` is ignored.
     */
    customComponent?: string
    /**
     * Initial local state for this node (makes it a state owner).
     * Supports `{{globalProps.*}}` and `{{data.*}}` bindings for initialization.
     */
    componentState?: Record<string, any>
} & (TextComponent | NativeComponent)
