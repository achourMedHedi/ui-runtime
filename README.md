# ui-runtime

UI is config. Logic is injected. Rendering is deterministic.

`ui-runtime` is a configuration-driven UI runtime for React. Instead of writing UI by hand in JSX, you define it as structured JSON config. The engine renders interactive interfaces directly from your config — layout, data binding, conditional rendering, state, and event wiring included.

```tsx
import Runtime from "@ui-runtime/runtime"

<Runtime
  {...config}
  data={{ user: { name: "Alice" } }}
  actions={{ onLogout: () => navigate("/login") }}
  customComponents={{}}
/>
```

---

## Why

Building frontend UIs is repetitive:

- You wire up layouts before APIs are ready, then rewrite when data changes shape
- The same tables, forms, and dashboards get rebuilt from scratch across projects
- UI and business logic stay tangled — changing one breaks the other

`ui-runtime` separates them cleanly. Define the UI as config. Inject real data and actions when ready. Refactor by editing JSON, not JSX.

---

## Install

```bash
npm install @ui-runtime/runtime
# peer deps
npm install react react-dom
```

---

## Quick start

```tsx
import Runtime, { ComponentConfig } from "@ui-runtime/runtime"


const config = {
  i: "root",
  x: 0, y: 0, w: 12, h: "screen",
  component: "div",
  props: { className: " h-full" },
  gridLayout: [
    {
      i: "greeting",
      x: 0, y: 0, w: 12, h: 48,
      component: "text",
      props: { as: "div", children: [{ text: "Hello {{data.user.name}}", className: "text-2xl font-bold" }] },
      gridLayout: []
    },
    {
      i: "btn-logout",
      x: 8, y: 10, w: 4, h: 40,
      component: "button",
      props: { children: "Log out", onClick: "{{actions.onLogout}}", className: "bg-red-500 text-white cursor-pointer px-4 py-2 rounded" },
      gridLayout: []
    }
  ]
}

export default function App() {
  return (
    <Runtime
      {...config}
      data={{ user: { name: "Alice" } }}
      actions={{ onLogout: () => alert("logged out") }}
      customComponents={{}}
    />
  )
}
```

---

## How it works

The runtime takes a `ComponentConfig` tree and recursively renders it using a CSS pixel-row grid. Two React components power it:

- **`Runtime`** — resolves bindings, computes visibility, owns local state when declared
- **`SubRuntime`** — handles per-child grid positioning, recurses back into `Runtime` for nested containers

```
ComponentConfig
  ├── data + actions          page-level reactive values
  ├── globalProps             scoped variables for subtree
  ├── gridLayout[]            recursive children
  └── visibleWhen / extraClassNamesWhen   conditional rendering
```

---

## Layout

Every node has a grid position. The grid uses 1px rows and configurable columns (default 12).

| Field | Type | Description |
|---|---|---|
| `i` | `string` | Unique node ID (required) |
| `x` | `number` | Start column (0-based) |
| `w` | `number` | Column span |
| `y` | `number \| string` | Pixel row start. Negative = from bottom. `"50%"` = 50% of parent height |
| `h` | `number \| "screen" \| "screen-N"` | Height in px. `"screen"` = 100vh. `"screen-64"` = `100vh - 64px` |
| `totalColumns` | `number` | Column count for this grid (default: 12, use 96 for fine-grained placement) |

```json
{ "i": "sidebar", "x": 0, "y": 0, "w": 3, "h": "screen" }
{ "i": "main",    "x": 3, "y": 0, "w": 9, "h": "screen" }
```

---

## Data binding

Props and text support `{{namespace.path}}` mustache bindings resolved before render.

| Namespace | Source | Example |
|---|---|---|
| `{{data.path}}` | `data` prop passed to Runtime | `"{{data.user.email}}"` |
| `{{actions.name}}` | `actions` prop — becomes a callable | `"{{actions.onSubmit}}"` |
| `{{globalProps.key}}` | Scoped variables for current subtree | `"{{globalProps.label}}"` |
| `{{props.key}}` | Other props on the same node | `"{{props.name}}"` |
| `{{state.path}}` | Local component state | `"{{state.isOpen}}"` |

**Type preservation** — a prop set to exactly one binding keeps its original type:
```json
{ "rows": "{{data.tableRows}}" }
```
`rows` receives the actual array, not a string.

**String interpolation** — multiple bindings in one string produce a concatenated result:
```json
{ "children": "Welcome, {{data.user.first}} {{data.user.last}}!" }
```

**Action bindings** — wrapped so local state is injected as first argument:
```json
{ "onClick": "{{actions.onSave}}" }
```
The action receives `(state, ...originalArgs)`.

---

## Conditional rendering

### `visibleWhen`

Hides the node (returns null) when the condition is not met.

```json
{
  "visibleWhen": { "ref": "state.isMenuOpen", "equals": true }
}
```

| Field | Description |
|---|---|
| `ref` | Dot-path with namespace prefix: `data.`, `state.`, `props.`, `globalProps.` |
| `equals` | Show when value equals this (any type) |
| `notEquals` | Show when value does NOT equal this |
| `isEmpty` | Show when value is falsy / empty |

### `extraClassNamesWhen`

Appends CSS classes conditionally — all matching rules are concatenated.

```json
{
  "extraClassNamesWhen": [
    { "ref": "globalProps.variant", "equals": "primary", "className": "bg-blue-600 text-white" },
    { "ref": "globalProps.variant", "equals": "ghost",   "className": "bg-transparent border border-blue-600" }
  ]
}
```

---


## Built-in components

| Key | Description |
|---|---|
| `div` | Generic container — any HTML div props |
| `button` | Button with optional `loading` / `loadingText` props |
| `text` | Inline text with mixed spans, divs, and router links via `BaseChildren[]` |
| `input` | Input with optional `react-hook-form` `register` integration |
| `form` | Form wrapper with `onSubmit` handler |
| `table` | Virtualized data table (TanStack Table + TanStack Virtual) |
| `portal` | Renders children into `document.body` via React portal |
| `slot` | Placeholder replaced by `slotChildren` from a parent custom component |

---

## Custom components

Custom components are **config templates**, not React components. Define a reusable layout once, then instantiate it with per-instance `globalProps`.

**Define:**
```tsx
const customComponents = {
  "card": {
    i: "card-root",
    component: "div",
    props: { className: "rounded-lg border p-4" },
    globalProps: {},
    gridLayout: [
      {
        i: "card-title", x: 0, y: 0, w: 12, h: 32,
        component: "text",
        props: { children: [{ text: "{{globalProps.title}}" }] },
        gridLayout: []
      }
    ]
  }
}
```

**Use:**
```json
{
  "i": "my-card",
  "customComponent": "card",
  "globalProps": { "title": "Revenue" },
  "x": 0, "y": 0, "w": 6, "h": 120,
  "component": "div",
  "props": {},
  "gridLayout": []
}
```

**Slots** — a custom component can expose a `slot` node that the parent fills with its own `gridLayout`:

```json
{ "i": "slot-area", "component": "slot", "x": 0, "y": 48, "w": 12, "h": 200, "gridLayout": [] }
```

Pass children via the parent's `gridLayout` — the runtime injects them in place of the slot.

---

## TypeScript

All types are exported:

```ts
import type {
  ComponentConfig,
  GridLayout,
  VisibleWhen,
  ExtraClassNameWhen,
  BaseChildren,
  WorkflowEvents,
} from "@ui-runtime/runtime"
```

---

## Known limitations

- Binding resolution is top-level only — nested object props (e.g. `style: { color: "{{data.brand}}" }`) are not traversed. Use a flat prop instead.
- No SSR support for `portal` in environments where `document` is unavailable on import (guarded at render time).
