import { forwardRef, type DetailedHTMLProps, type TextareaHTMLAttributes } from "react"

type Props = Omit<DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>, "children"> & {
    // the runtime always injects these onto registered components (see UiRuntime.tsx) —
    // accept and drop them here so they never leak onto the native <textarea>.
    data?: unknown
    actions?: unknown
}

// Pure passthrough: renders only the textarea box, same convention as Input.
const Textarea = forwardRef<HTMLTextAreaElement, Props>(
    ({ data: _data, actions: _actions, ...rest }, ref) => {
        return <textarea {...rest} ref={ref} />
    }
)

Textarea.displayName = "Textarea"

export default Textarea
