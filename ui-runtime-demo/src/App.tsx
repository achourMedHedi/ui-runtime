// @ts-ignore
import { URContext, URRenderer } from "ur-react"
// @ts-ignore
import type { URComponentConfig } from "ur-react"
import { useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form"
import Container from "./components/Container"
// Stand-in for a `GET /dashboard-config` response: a plain data payload,
// not something built with JS — the runtime validates each node on its own.
import dashboardConfig from "./dashboard-config.json"

import Input from "./components/Input"
import Select from "./components/Select"
import Textarea from "./components/Textarea"
import Form from "./components/Form"
import ItemList from "./components/ItemList"
import Table from "./components/Table"
import CategoryBadge from "./components/CategoryBadge"
import HeaderLabel from "./components/HeaderLabel"
import QuantityBadge from "./components/QuantityBadge"
import Portal from "./components/Portal"
import CreateItemModal from "./components/CreateItemModal"
import type { Item } from "./types"

function Button(props: { children?: React.ReactNode; onClick?: Function; style?: CSSProperties; className?: string; type?: "button" | "submit" | "reset" }) {
  return <button type={props.type} style={props.style} className={props.className} onClick={() => props.onClick?.()}>{props.children}</button>
}

const components = { Button, Container, Input, Select, Textarea, Form, ItemList, Table, CategoryBadge, HeaderLabel, QuantityBadge, Portal, CreateItemModal }

// Hoisted to a module-level constant, not built inline in the JSX below —
// `<URContext.Provider value={{ components, version: "..." }}>` would
// rebuild this object on every App render, and a Context value change forces
// every consumer to re-render regardless of React.memo (this is the same
// class of bug fixed in UiRuntime.tsx's URDataContext value, just at the
// outermost, whole-tree-wide level instead of per-node).
const urContextValue = { components, version: "0.1.0" as const }

const config = dashboardConfig as unknown as URComponentConfig<typeof components>

const revenuePresets = ["$48,320", "$52,100", "$44,900"]
const itemCategories = ["Electronics", "Clothing", "Food", "Other"]

type ItemFormValues = Omit<Item, "id">

function App() {
  const [data, setData] = useState({
    tab: "overview" as "overview" | "details" | "add" | "table",
    expanded: false,
    revenue: revenuePresets[0],
    revenueIdx: 0,
    items: [] as Item[],
  })

  // The "Add Item" form itself lives entirely in dashboard-config.json (labels,
  // inputs, select, textarea, submit button) — react-hook-form just owns the
  // values/validation here and hands them to the config as data/actions,
  // the same way `tab`/`expanded`/`revenue` already do.
  const itemForm = useForm<ItemFormValues>({
    defaultValues: { name: "", quantity: 1, category: itemCategories[0], notes: "" },
  })
  const formValues = itemForm.watch()
  const formErrors = itemForm.formState.errors

  const nameField = itemForm.register("name", { required: "Name is required" })
  const quantityField = itemForm.register("quantity", {
    required: "Quantity is required",
    valueAsNumber: true,
    min: { value: 1, message: "Must be at least 1" },
  })
  const categoryField = itemForm.register("category")
  const notesField = itemForm.register("notes")

  // The pure-config "Update Item" modal (see dashboard-config.json) is built
  // from the exact same recipe as the Add Item tab — a second react-hook-form
  // instance whose values/errors are hand ed to config as `data.editForm.*`
  // and whose fields are bound the same way. `editingId` is which item (if
  // any) the modal is open for; the modal's own `open` binding is just
  // `editingId !== null`.
  const editForm = useForm<ItemFormValues>({
    defaultValues: { name: "", quantity: 1, category: itemCategories[0], notes: "" },
  })
  const editFormValues = editForm.watch()
  const editFormErrors = editForm.formState.errors
  const [editingId, setEditingId] = useState<string | null>(null)

  const editNameField = editForm.register("name", { required: "Name is required" })
  const editQuantityField = editForm.register("quantity", {
    required: "Quantity is required",
    valueAsNumber: true,
    min: { value: 1, message: "Must be at least 1" },
  })
  const editCategoryField = editForm.register("category")
  const editNotesField = editForm.register("notes")

  const actions = {
    showOverview: () => setData((d) => ({ ...d, tab: "overview" })),
    showDetails: () => setData((d) => ({ ...d, tab: "details" })),
    showAdd: () => setData((d) => ({ ...d, tab: "add" })),
    showTable: () => setData((d) => ({ ...d, tab: "table" })),
    toggleExpanded: () => setData((d) => ({ ...d, expanded: !d.expanded })),
    refreshRevenue: () =>
      setData((d) => {
        const revenueIdx = (d.revenueIdx + 1) % revenuePresets.length
        return { ...d, revenueIdx, revenue: revenuePresets[revenueIdx] }
      }),
    setItemName: nameField.onChange,
    setItemQuantity: quantityField.onChange,
    setItemCategory: categoryField.onChange,
    setItemNotes: notesField.onChange,
    // `ref` is just another function — the config can bind it exactly like
    // onChange, giving each field a real, fully-registered RHF field instead
    // of a partial (onChange-only) one.
    setItemNameRef: nameField.ref,
    setItemQuantityRef: quantityField.ref,
    setItemCategoryRef: categoryField.ref,
    setItemNotesRef: notesField.ref,
    submitItem: itemForm.handleSubmit((values) => {
      setData((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), ...values }] }))
      itemForm.reset()
    }),
    removeItem: (item: Item) => setData((d) => ({ ...d, items: d.items.filter((i) => i.id !== item.id) })),
    // bound as `onCreate` on the user-component Create modal — it already
    // validated/collected the values itself, so this just appends.
    createItem: (item: ItemFormValues) =>
      setData((d) => ({ ...d, items: [...d.items, { id: crypto.randomUUID(), ...item }] })),
    // bound as a row action (`rowActionKeys`) on the Table, so it's called
    // with that row's item as the first argument — same wiring as removeItem.
    openEditModal: (item: Item) => {
      editForm.reset({ name: item.name, quantity: item.quantity, category: item.category, notes: item.notes })
      setEditingId(item.id)
    },
    closeEditModal: () => setEditingId(null),
    setEditItemName: editNameField.onChange,
    setEditItemQuantity: editQuantityField.onChange,
    setEditItemCategory: editCategoryField.onChange,
    setEditItemNotes: editNotesField.onChange,
    setEditItemNameRef: editNameField.ref,
    setEditItemQuantityRef: editQuantityField.ref,
    setEditItemCategoryRef: editCategoryField.ref,
    setEditItemNotesRef: editNotesField.ref,
    saveEdit: editForm.handleSubmit((values) => {
      setData((d) => ({ ...d, items: d.items.map((i) => (i.id === editingId ? { ...i, ...values } : i)) }))
      setEditingId(null)
    }),
  }

  const runtimeData = {
    ...data,
    itemCategories,
    form: {
      ...formValues,
      // keep the number input controlled without React's "NaN" warning
      // while the field is empty/being edited
      quantity: Number.isNaN(formValues.quantity as number) ? "" : formValues.quantity,
    },
    formErrors: {
      name: formErrors.name?.message ?? "",
      quantity: formErrors.quantity?.message ?? "",
    },
    formErrorClass: {
      name: formErrors.name ? "has-error" : "",
      quantity: formErrors.quantity ? "has-error" : "",
    },
    isEditModalOpen: editingId !== null,
    editForm: {
      ...editFormValues,
      quantity: Number.isNaN(editFormValues.quantity as number) ? "" : editFormValues.quantity,
    },
    editFormErrors: {
      name: editFormErrors.name?.message ?? "",
      quantity: editFormErrors.quantity?.message ?? "",
    },
    editFormErrorClass: {
      name: editFormErrors.name ? "has-error" : "",
      quantity: editFormErrors.quantity ? "has-error" : "",
    },
  }

  return (
    <URContext.Provider value={urContextValue}>
        <URRenderer {...config} data={runtimeData} actions={actions} />
    </URContext.Provider>
  )
}

export default App
