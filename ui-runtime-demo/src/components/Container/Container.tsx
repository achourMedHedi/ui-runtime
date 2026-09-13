import { type URComponentConfig, URRenderer } from "../../../../packages/react/index.tsx"
import { type CSSProperties, type FC } from "react"

type ContainerProps = { style: CSSProperties, children: URComponentConfig[] }

// `data`/`actions` aren't threaded manually here — URRenderer inherits them
// from context automatically (see packages/react/context.ts).
const Container: FC<ContainerProps> = (props) => {
    if (typeof props.children === "string") {
        return props.children
    }

    return (
        <div style={props.style}>
            {props.children?.map((el) => <URRenderer key={el.id} {...el} />)}
        </div>
    )
}

export default Container
