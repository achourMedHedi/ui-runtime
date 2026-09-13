import { type FC, type HTMLAttributes } from "react"
import { type URComponentConfig, URRenderer } from "../../../../packages/react/index.tsx"


type FormProps = HTMLAttributes<HTMLFormElement> & { children: URComponentConfig[] } & {
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
}

// `data`/`actions` aren't threaded manually here — URRenderer inherits them
// from context automatically (see packages/react/context.ts).
const Form: FC<FormProps> = ({ children, onSubmit, ...rest }) => {

    return <form {...rest} onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(e)
    }}>
        {children?.map((el) => <URRenderer key={el.id} {...el} />)}
    </form>
}

export default Form