import { forwardRef, type DetailedHTMLProps, type InputHTMLAttributes } from "react"

type Props = Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "children"> & {
    // the runtime always injects these onto registered components (see UiRuntime.tsx) —
    // accept and drop them here so they never leak onto the native <input>.
    data?: unknown
    actions?: unknown
}

// Pure passthrough: renders only the input box. No baked-in styling — style,
// label placement, and error state are all owned by the caller (see
// AddItemForm's `Field` wrapper and `controlStyle`).
const Input = forwardRef<HTMLInputElement, Props>(
    ({ data: _data, actions: _actions, ...rest }, ref) => {
        return <input {...rest} ref={ref} />
    }
)

Input.displayName = "Input"

export default Input
