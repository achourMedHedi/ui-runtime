# ui-runtime

A config-driven React UI runtime you drop into an **existing** app — not a platform you migrate into.

Most "config-driven UI" tools (Retool, Appsmith, Budibase, low-code builders in general) want you to build *inside* them: their auth, their data layer, their hosting. `ui-runtime` is the opposite bet: it's a library. Your app keeps its own React tree, its own auth, its own API calls — you just hand one subtree a JSON config plus the `data`/`actions` your app already has, and it renders. The runtime never touches your state; it only reads it.

```tsx
import { URContext, URRenderer } from "ur-react"

// any React component works — the runtime just needs to find it by name
const components = { Card, Button }

const config = {
  id: "greeting",
  component: "Card",
  layout: { engine: "flex", direction: "column", gap: 8, x: 0, y: 0, w: 1, h: 1 },
  props: {
    children: [
      { id: "label", component: "Card", layout: { engine: "flex", x: 0, y: 0, w: 1, h: 1 },
        props: { children: "Hello, {{data.name}}" } },
      { id: "cta", component: "Button", layout: { engine: "flex", x: 0, y: 0, w: 1, h: 1 },
        props: { children: "Refresh", onClick: "{{actions.refresh}}" } },
    ],
  },
}

function App() {
  const [name, setName] = useState("world")
  return (
    <URContext.Provider value={{ components, version: "0.1.0" }}>
      <URRenderer {...config} data={{ name }} actions={{ refresh: () => setName("there") }} />
    </URContext.Provider>
  )
}
```

`data`/`actions` are just props — fetch with whatever you already use (REST, GraphQL, TanStack Query), own the state however you want, pass the result in. The config decides *what renders*; your app decides *what's true*.

**Two ways to extend a config, shown side by side in the demo, not just described:** compose a feature out of the built-in primitives (`Container`, `Input`, `Select`, `Button`, `Portal`, ...) purely in JSON, or drop to a real registered React component when config gets awkward — and call back into config-bound `data`/`actions` from inside it either way. `ui-runtime-demo/src/dashboard-config.json`'s Table (`ui-runtime-demo/src/components/Table`) is the walkthrough: sorting, filtering (an inline dropdown *and* an icon-triggered popover), column grouping, and full create/edit modals — each built once as a pure-config tree and once as a dedicated component, doing the identical thing.

Layout is grid (explicit `x`/`y`/`w`/`h` coordinates, CSS Grid under the hood) or flex (`direction`/`gap`/`align`/`justify`, array order, sizes to content) per node, mixable anywhere in the tree.

## The packages

A monorepo (linked via Yarn `portal:` dependencies, not Yarn workspaces) containing:

- **`packages/core`** (`core`) — framework-agnostic config schema validation, built on [Zod](https://zod.dev).
- **`packages/react`** (`ur-react`) — React bindings for `core`.
- **`ui-runtime-demo`** — a Vite + React demo app that consumes `ur-react`.

Each package is its own independent Yarn project (own `yarn.lock`, own `node_modules`) and points at its local sibling via a `portal:` dependency, so **build order matters**: `core` must be built before `react`, and `react` must be built before the demo app will run.

## Prerequisites

- Node.js 20+
- [Corepack](https://nodejs.org/api/corepack.html) enabled, so the pinned `yarn@4.11.0` is used automatically:
  ```bash
  corepack enable
  ```

## Setup

Clone the repo, then install and build each package **in this order**:

### 1. `core`

```bash
cd packages/core
yarn install
yarn build
```

### 2. `react`

```bash
cd ../react
yarn install
yarn build
```

`ur-react` depends on `core` via `portal:../core`, so step 1 must be done first — `yarn build` here reads `core`'s built `dist/` output.

### 3. Demo app

```bash
cd ../../ui-runtime-demo
yarn install
yarn dev
```

`ui-runtime-demo` depends on `ur-react` via `portal:../packages/react`, so step 2 must be done first.

This starts the Vite dev server — open the printed local URL in your browser.

## Rebuilding during development

If you change code in `packages/core` or `packages/react`, rebuild that package (`yarn build`, or `yarn dev` inside the package to watch and rebuild on change) so the demo app picks up the new `dist/` output. Restart the demo's dev server if changes don't show up.

## Other scripts

| Package              | Script         | Description                     |
|-----------------------|---------------|----------------------------------|
| `packages/core`       | `yarn test`   | Runs the core package's tests    |
| `ui-runtime-demo`     | `yarn build`  | Type-checks and builds for prod  |
| `ui-runtime-demo`     | `yarn lint`   | Runs ESLint                      |
| `ui-runtime-demo`     | `yarn preview`| Previews the production build    |
