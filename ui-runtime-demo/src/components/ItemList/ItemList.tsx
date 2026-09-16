import type { FC } from "react"
import type { Item } from "../../types"
import ItemRow from "./ItemRow"

type ItemListProps = {
    items?: Item[]
    // injected automatically by the runtime (see UiRuntime.tsx) — unused here
    data?: unknown
    actions?: unknown
}

const ItemList: FC<ItemListProps> = ({ items = [] }) => {
    return (
        <div
            style={{
                height: "100%",
                boxSizing: "border-box",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflow: "hidden",
            }}
        >
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                Items {items.length > 0 && <span style={{ color: "#9ca3af", fontWeight: 400 }}>({items.length})</span>}
            </div>

            {items.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
                    No items yet — add one to get started.
                </div>
            ) : (
                <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map((item) => (
                        <ItemRow key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default ItemList
