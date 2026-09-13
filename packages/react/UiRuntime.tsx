import { CSSProperties, useMemo } from "react"
import { URComponentConfig, URComponentType } from "core"
import { URDataContext } from "./context"
import useStyle from "./hooks/useStyle"
import { formatGridContainerStyle } from "./utils/style"
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
    const defaultStyle: CSSProperties = formatGridContainerStyle(layout, childList)

    return (
        <div style={{ ...style, ...customStyle }}>
            <URDataContext.Provider value={{ data: data || {}, actions: actions || {} }}>
                <Component
                    key={id}
                    {...configProps}
                    style={defaultStyle}
                    data={data}
                    actions={actions}
                />
            </URDataContext.Provider>
        </div>
    )
}

export default UiRuntime
