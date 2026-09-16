import { forwardRef, type DetailedHTMLProps, type SelectHTMLAttributes } from "react"

// A plain string is both the value and the label (the original shape, still
// how every option list in this app works) — `{ value, label }` is only for
// a case that needs them to differ, e.g. an empty-string "clear filter"
// option that can't show as a blank line in the dropdown.
type SelectOption = string | { value: string; label: string }

type Props = Omit<DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>, "children"> & {
    options?: SelectOption[]
    // the runtime always injects these onto registered components (see UiRuntime.tsx) —
    // accept and drop them here so they never leak onto the native <select>.
    data?: unknown
    actions?: unknown
}

// Pure passthrough like Input. The only thing it adds is turning a flat
// `options` list into <option> tags, since JSON config has no way to express
// native children directly.
const Select = forwardRef<HTMLSelectElement, Props>(
    ({ options = [], data: _data, actions: _actions, ...rest }, ref) => {
        return (
            <select {...rest} ref={ref}>
                {options.map((option) => {
                    const value = typeof option === "string" ? option : option.value
                    const label = typeof option === "string" ? option : option.label
                    return (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    )
                })}
            </select>
        )
    }
)

Select.displayName = "Select"

export default Select
