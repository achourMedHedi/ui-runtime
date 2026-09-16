import { CSSProperties, useMemo } from "react"
import { URComponentConfig, URComponentType } from "core"
import { URDataContext } from "./context"
import useStyle from "./hooks/useStyle"
import { formatContainerStyle } from "./utils/style"
import { replaceActionsRefs, replaceDataRefs } from "./utils"

type UiRuntimeProps = Omit<URComponentConfig, "component"> & {
    component: URComponentType
}

const useComponentConfigProps = (props: URComponentConfig["props"], data: URComponentConfig["data"], actions: URComponentConfig["actions"]) => {
    return useMemo(() => {
        return Object.entries(props || {}).reduce((acc, [key, value]) => {
            if (typeof value === "string") {
                if (value.startsWith("{{actions.")) {
                    acc[key] = replaceActionsRefs(value, actions || {})
                } else {
                    acc[key] = replaceDataRefs(value, data || {})
                }
            } else {
                acc[key] = value
            }
            return acc
        }, {} as Record<string, any>)
    }, [props, data, actions])
}

const UiRuntime: React.FC<UiRuntimeProps> = ({ layout, component: Component, props, data, id, actions, style: customStyle }) => {
    const style = useStyle(layout)
    const configProps = useComponentConfigProps(props, data, actions)

    const childList = Array.isArray(props?.children) ? props.children as URComponentConfig[] : undefined
    const defaultStyle: CSSProperties = formatContainerStyle(layout, childList)

    // A fresh object here — even with identical data/actions inside — is a
    // new Context value every render, which re-renders every consumer down
    // the tree regardless of memoization anywhere else (Context updates
    // bypass React.memo). Memoizing it is what actually lets the
    // React.memo(URRenderer) boundary (see index.tsx) skip work: it only
    // holds when the *caller* also hands this node stable `data`/`actions`
    // references — a host that rebuilds them every render (as this repo's
    // own demo App.tsx currently does) won't see the benefit until it does.
    const contextValue = useMemo(() => ({ data: data || {}, actions: actions || {} }), [data, actions])

    return (
        <div style={{ ...style, ...customStyle }}>
            <URDataContext.Provider value={contextValue}>
                <Component
                    key={id}
                    {...configProps}
                    // `defaultStyle` (grid sizing/arrangement) is load-bearing and
                    // must always apply; `configProps.style` — a component's own
                    // `props.style` from config — merges on top so a config can
                    // still set its own decorative styling (was previously
                    // clobbered outright by the line below).
                    style={{ ...defaultStyle, ...configProps.style }}
                    data={data}
                    actions={actions}
                />
            </URDataContext.Provider>
        </div>
    )
}

export default UiRuntime
