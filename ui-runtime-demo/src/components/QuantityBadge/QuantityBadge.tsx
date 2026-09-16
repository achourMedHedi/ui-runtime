import type { FC } from "react"

type QuantityBadgeProps = {
    value?: number
    // injected automatically by the runtime (see UiRuntime.tsx) — unused here
    data?: unknown
    actions?: unknown
}

// A custom, registered component used directly as a Table cell's
// `component` — the counterpart to the plain-config `Container` cell,
// proving a column's cell can hand off to whatever the app owner registers
// instead of raw config, same as CategoryBadge/HeaderLabel do elsewhere.
const QuantityBadge: FC<QuantityBadgeProps> = ({ value }) => (
    <span
        style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#3730a3",
            background: "#eef2ff",
            borderRadius: 999,
            padding: "2px 10px",
        }}
    >
        {value}
    </span>
)

export default QuantityBadge
