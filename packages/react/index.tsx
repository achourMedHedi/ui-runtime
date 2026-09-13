import type { URComponentConfig, URContext as TURContext, URLayoutConfig, URComponentType } from "core"
import { URConfigValidator } from "core"
import { useContext, useMemo } from "react"
import UiRuntime from "./UiRuntime"
import { isEmptyValue, replaceDataRefs } from "./utils"
import { URContext, URDataContext } from "./context"

export type { URComponentConfig, TURContext }
export { URContext, URDataContext }

export function URRenderer(props: URComponentConfig) {
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
    return <UiRuntime {...result.data} data={data} actions={actions} component={Component} />
}
