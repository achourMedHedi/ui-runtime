import type { FC } from "react"
import type { Item } from "../../types"
import { getCategoryColor } from "../categoryColors"

const ItemRow: FC<{ item: Item }> = ({ item }) => (
    <div
        style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
        }}
    >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.name}
            </span>
            <span style={{ fontSize: 12, color: "#374151", flexShrink: 0 }}>×{item.quantity}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: getCategoryColor(item.category),
                    background: "#f3f4f6",
                    borderRadius: 999,
                    padding: "1px 8px",
                }}
            >
                {item.category}
            </span>
            {item.notes && (
                <span style={{ fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.notes}
                </span>
            )}
        </div>
    </div>
)

export default ItemRow
