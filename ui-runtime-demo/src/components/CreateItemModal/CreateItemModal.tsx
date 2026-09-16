import { useEffect, useState, type CSSProperties, type FC } from "react"
import { createPortal } from "react-dom"

type NewItem = { name: string; quantity: number; category: string; notes: string }

type CreateItemModalProps = {
    categories?: string[]
    onCreate?: (item: NewItem) => void
    // injected automatically by the runtime (see UiRuntime.tsx) — unused here
    data?: unknown
    actions?: unknown
}

const inputStyle: CSSProperties = {
    fontSize: 13,
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
}

const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }

const emptyValues = (categories: string[]): NewItem => ({ name: "", quantity: 1, category: categories[0] ?? "", notes: "" })

// A custom, registered component used directly in the dashboard config as
// the Table panel's "Create Item" trigger — the counterpart to the
// pure-config Update modal built in dashboard-config.json out of Portal +
// Container/Input/Select/Textarea. Everything (the trigger button, open
// state, form fields, validation, and the portal itself) lives inside this
// one component; the config only ever hands it `categories` and `onCreate`.
const CreateItemModal: FC<CreateItemModalProps> = ({ categories = [], onCreate }) => {
    const [open, setOpen] = useState(false)
    const [values, setValues] = useState<NewItem>(() => emptyValues(categories))
    const [error, setError] = useState("")
    // `createPortal(..., document.body)` below runs during render, not an
    // effect — `document` doesn't exist during SSR. `open` always starts
    // false here so the crash isn't reachable in practice, but gating on
    // "mounted" (which only flips true client-side, after hydration) keeps
    // this safe even if that assumption ever changes, same as Portal.tsx.
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    useEffect(() => {
        if (!open) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [open])

    const openModal = () => {
        setValues(emptyValues(categories))
        setError("")
        setOpen(true)
    }
    const close = () => setOpen(false)
    const create = () => {
        if (!values.name.trim()) {
            setError("Name is required")
            return
        }
        onCreate?.(values)
        setOpen(false)
    }

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #4f46e5",
                    background: "#4f46e5",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                }}
            >
                + Create Item
            </button>

            {mounted && open &&
                createPortal(
                    <>
                        <div
                            onClick={close}
                            style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 999 }}
                        />
                        <div
                            style={{
                                position: "fixed",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 1000,
                                background: "#fff",
                                borderRadius: 12,
                                boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                                padding: 20,
                                width: 320,
                                boxSizing: "border-box",
                            }}
                        >
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Create Item</div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={labelStyle}>Name</label>
                                <input
                                    autoFocus
                                    value={values.name}
                                    onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                                    placeholder="e.g. Wireless mouse"
                                    style={inputStyle}
                                />
                                {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{error}</div>}
                            </div>

                            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Quantity</label>
                                    <input
                                        type="number"
                                        value={values.quantity}
                                        onChange={(e) => setValues((v) => ({ ...v, quantity: Number(e.target.value) }))}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Category</label>
                                    <select
                                        value={values.category}
                                        onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
                                        style={inputStyle}
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Notes</label>
                                <textarea
                                    rows={2}
                                    value={values.notes}
                                    onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
                                    placeholder="Optional details"
                                    style={{ ...inputStyle, resize: "vertical" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={close}
                                    style={{
                                        fontSize: 13,
                                        padding: "8px 14px",
                                        borderRadius: 8,
                                        border: "1px solid #d1d5db",
                                        background: "#fff",
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={create}
                                    style={{
                                        fontSize: 13,
                                        padding: "8px 14px",
                                        borderRadius: 8,
                                        border: "none",
                                        background: "#4f46e5",
                                        color: "#fff",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </>,
                    document.body
                )}
        </>
    )
}

export default CreateItemModal
