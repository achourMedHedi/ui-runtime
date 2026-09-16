import type { FC } from "react"
import { getCategoryColor } from "../categoryColors"

type CategoryBadgeProps = {
    category?: string
    // injected automatically by the runtime (see UiRuntime.tsx) — unused here
    data?: unknown
    actions?: unknown
}

// A custom, registered component used directly as a Table cell's `component`
// — the counterpart to the plain-config `Container` cells, proving a column
// can hand off to whatever the app owner registers instead of raw config.
const CategoryBadge: FC<CategoryBadgeProps> = ({ category = "" }) => (
    <span
        style={{
            fontSize: 11,
            fontWeight: 600,
            color: getCategoryColor(category),
            background: "#f3f4f6",
            borderRadius: 999,
            padding: "1px 8px",
        }}
    >
        {category}
    </span>
)

export default CategoryBadge
