# ui-runtime

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
