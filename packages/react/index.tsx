import type { URComponentConfig, URContext as TURContext, URLayoutConfig, URComponentType } from "core"
import { URConfigValidator } from "core"
import { memo, useContext, useMemo } from "react"
import UiRuntime from "./UiRuntime"
import NodeErrorBoundary from "./ErrorBoundary"
import { isEmptyValue, replaceDataRefs, getByPath } from "./utils"
import { URContext, URDataContext } from "./context"

export type { URComponentConfig, TURContext }
export { URContext, URDataContext, getByPath }

function URRendererImpl(props: URComponentConfig) {
    // All hooks run unconditionally, before any early return below — the
    // validity/registration checks that follow must never gate a hook call.
    const { components } = useContext(URContext)
    const inherited = useContext(URDataContext)

    const data = useMemo(() => ({ ...inherited.data, ...props.data }), [inherited.data, props.data])
    const actions = useMemo(() => ({ ...inherited.actions, ...props.actions }), [inherited.actions, props.actions])

    const result = URConfigValidator(props)

    const isVisible = useMemo(() => {
        if (!props.visibleWhen) return true
        const { ref, equals, notEquals, isEmpty } = props.visibleWhen
        const value = replaceDataRefs(ref, data)

        if (equals !== undefined && value !== equals) return false
        if (notEquals !== undefined && value === notEquals) return false
        if (isEmpty !== undefined && isEmptyValue(value) !== isEmpty) return false

        return true
    }, [props.visibleWhen, data])

    if (!result.success) {
        console.error(`[ur] invalid component config "${props.id}"`, result.errors)
        return null
    }

    const Component = components[props.component]
    if (!Component) {
        console.error(`[ur] no component registered for "${result.data.component}"`)
        return null
    }

    if (!isVisible) {
        return null
    }
    return (
        <NodeErrorBoundary id={props.id}>
            <UiRuntime {...result.data} data={data} actions={actions} component={Component} />
        </NodeErrorBoundary>
    )
}

// Memoized so a node with referentially-stable `data`/`actions` skips
// re-rendering (and, since a skipped render never reaches its own child
// URRenderer calls, so does everything under it) when something unrelated
// changes elsewhere in the tree. Every other field on URComponentConfig
// (layout, visibleWhen, style, props, component, id) already comes from the
// static config and is naturally reference-stable across re-spreads, so the
// default shallow comparator is exactly right here — no custom one needed.
// This only pays off for callers that hand this node stable references;
// see the note on `contextValue` in UiRuntime.tsx.
export const URRenderer = memo(URRendererImpl)
