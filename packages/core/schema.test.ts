import { test } from "node:test"
import assert from "node:assert/strict"
import { validateComponentConfig } from "./schema.ts"

test("accepts a minimal valid config", () => {
    const result = validateComponentConfig({
        id: "root",
        component: "Div",
    })
    assert.equal(result.success, true)
})

test("accepts a nested config with layout and children", () => {
    const result = validateComponentConfig({
        id: "root",
        component: "Div",
        layout: { engine: "grid", columns: 12, x: 0, y: 0, w: 12, h: 4 },
        children: [
            { id: "child-1", component: "Button", props: { label: "Click me" } },
        ],
    })
    assert.equal(result.success, true)
})

test("rejects a config with the wrong field types", () => {
    const result = validateComponentConfig({
        id: "root",
        component: 42,
        layout: { engine: "grid", columns: 12, x: "0", y: 0, w: 12, h: 4 },

    })
    assert.equal(result.success, false)
    if (result.success) return
    const paths = result.errors.map((issue) => issue.path.join("."))
    assert.deepEqual(paths, ["component", "layout.x"])
})

test("rejects a config missing required fields", () => {
    const result = validateComponentConfig({ component: "Div" })
    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.errors[0].path.join("."), "id")
})

test("rejects a non-object config", () => {
    const result = validateComponentConfig("not a config")
    assert.equal(result.success, false)
})
