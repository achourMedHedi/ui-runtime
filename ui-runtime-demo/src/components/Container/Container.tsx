import { type URComponentConfig, URRenderer } from "../../../../packages/react/index.tsx"
import { type CSSProperties, type FC } from "react"

type ContainerProps = {
    style: CSSProperties
    children: URComponentConfig[] | string | number | boolean
    // Optional, like Button/Input's onClick — lets a plain Container act as a
    // click target (e.g. a config-composed sortable header) without needing
    // a dedicated component just to wire up a handler.
    onClick?: () => void
}

// `data`/`actions` aren't threaded manually here — URRenderer inherits them
// from context automatically (see packages/react/context.ts).
const Container: FC<ContainerProps> = (props) => {
    // A `{{data.x}}` binding preserves the value's original type (see
    // replaceDataRefs) — a numeric/boolean field bound as `children` (e.g. a
    // table cell showing `quantity`) arrives here as a number/boolean, not a
    // string, so any non-array leaf value takes the same direct-render path.
    // A raw value has nothing to attach a click handler to, though, so it
    // only takes that shortcut when `onClick` isn't in play.
    if (props.children !== undefined && !Array.isArray(props.children) && !props.onClick) {
        return props.children
    }

    if (props.children !== undefined && !Array.isArray(props.children)) {
        return <span onClick={props.onClick}>{props.children}</span>
    }

    return (
        <div style={props.style} onClick={props.onClick}>
            {props.children?.map((el) => <URRenderer key={el.id} {...el} />)}
        </div>
    )
}

export default Container
