import { FC, memo, useMemo } from "react"
import { BaseChildren, ComponentConfig, GridLayout } from "./types"
import { COMPONENTS } from "./component"
import replaceGlobalProps from "./utils/runtime/replaceGlobalProps"
import replaceData from "./utils/runtime/replaceData"
import replaceChildren from "./utils/runtime/replaceChildren"
import getIsVisible from "./utils/runtime/getIsVisible"
import getIsExtraClassNamesWhen from "./utils/runtime/getIsExtraClassNamesWhen";
import Runtime from "./Runtime"


const SubRuntime: FC<ComponentConfig & { customComponents: Record<string, ComponentConfig>, parentState: Record<string, any> } & { slotChildren?: GridLayout[], slotGlobalProps?: Record<string, any> }> = memo((initConfig) => {
    let config = initConfig
    const globalData = initConfig.data || {}
    const globalActions = initConfig.actions || {}
    const componentID = config.customComponent || config.component
    const slotChildren = initConfig.slotChildren || []
    const slotGlobalProps = initConfig.slotGlobalProps || undefined
    let Comp = { ...COMPONENTS }[componentID]

    const globalProps = useMemo(() => replaceGlobalProps(config.globalProps || {}, globalData || {}, globalActions || {}, config.parentState || {}, slotGlobalProps || {}), [config.globalProps, globalData, globalActions, config.parentState, slotGlobalProps, slotGlobalProps])
    if (!Comp) {
        const customComponentData = config.customComponent && config.customComponents[config.customComponent]
        if (customComponentData) {
            config = { ...customComponentData, globalProps: initConfig.globalProps || {}, x: initConfig.x, y: initConfig.y, w: initConfig.w, h: initConfig.h, customComponents: initConfig.customComponents || {} }
            console.log("sub runtime", initConfig)
            Comp = (xyz: any) => (
                <div
                    key={config.i}
                    style={xyz.style || {}}
                >
                    <Runtime
                        {...customComponentData}
                        customComponents={initConfig.customComponents}
                        globalProps={initConfig.globalProps || {}}
                        x={initConfig.x}
                        y={initConfig.y}
                        w={initConfig.w}
                        h={initConfig.h}
                        data={globalData || {}}
                        actions={globalActions || {}}
                        parentState={config.parentState || {}}
                        slotChildren={slotChildren}
                        slotGlobalProps={slotGlobalProps}
                    />
                </div>
            )
        }

    }





    const props = useMemo(() => replaceData(config.props, globalData || {}, globalActions || {}, globalProps || {}, config.parentState || {}), [config.props, globalData, globalActions, globalProps, config.parentState])
    const isVisible = useMemo(() => getIsVisible(globalData || {}, props || {}, globalProps || {}, config.visibleWhen, config.parentState || {}), [globalData, props, globalProps, config.visibleWhen, config.parentState])
    const withExtraClassNameWhen = useMemo(() => getIsExtraClassNamesWhen(globalData || {}, props || {}, globalProps || {}, config.extraClassNamesWhen || [], config.parentState || {}), [globalData, props, globalProps, config.extraClassNamesWhen, config.parentState])

    let children = config.props.children?.length ? config.props.children : [] as BaseChildren[]
    children = useMemo(() => children ? replaceChildren(children || [], globalData || {}, props || {}, globalProps || {}, config.parentState || {}) : [], [children, globalData, props, globalProps, config.parentState])
    const parentHeight = useMemo(() => config.parentHeight || 0, [config.parentHeight])

    if (!Comp) {
        return <div>Component not found {componentID}</div>
    }


    if (!isVisible) return null

    let y = config.y
    if (typeof config.y === "number" && config.y < 0) {
        y = parentHeight + config.y
    }
    else if (typeof config.y === "string" && config.y.includes("%")) {
        y = Math.round(parentHeight * parseInt(config.y.replace("%", "")) / 100)
    }
    let h = config.h
    if (typeof config.h === "string" && config.h.includes("screen-")) {
        h = window.innerHeight - Number(config.h.replace("screen-", ""))
    } else if (typeof config.h === "string" && config.h.includes("screen")) {
        h = window.innerHeight
    } else if (typeof config.h === "number") {
        h = Number(config.h)
    }

    // When there's a gridLayout, use a neutral wrapper since Runtime will render the actual component
    // This prevents nested elements (e.g., form inside form)
    // console.log("salem config--- sub runtime", config.i, config, slotChildren)
    if (config.gridLayout?.length) {
        return <div
            key={config.i}
            style={{
                gridColumn: `${config.x + 1} / span ${config.w}`,
                gridRow: `${Number(y) + 1} / span ${h}`,
            }}
            id="sub-sub-runtime"
        >
            <Runtime
                {...config}
                key={config.i}
                parentHeight={Number(h)}
                customComponents={config.customComponents || {}}
                globalProps={globalProps || {}}
                data={globalData || {}}
                actions={globalActions || {}}
                parentState={config.parentState || {}}
                slotChildren={slotChildren.length ? slotChildren : undefined}
                slotGlobalProps={slotGlobalProps}
            />
        </div>
    }


    if (config.customComponent) {
        return <div>Custom component in sub runtime {config.customComponent}</div>
    }
    // @ts-ignore
    return <Comp
        {...props as Record<string, any>}
        className={`${config.props.className} ${withExtraClassNameWhen}`}
        key={config.i}
        style={{
            gridColumn: `${config.x + 1} / span ${config.w}`,
            gridRow: `${Number(y) + 1} / span ${h}`,
        }}
        {...(config.component === "table" ? ({
            data: globalData || {},
            actions: globalActions || {},
        }) : ({}))}
        id="sub-runtime"
        customComponents={config.customComponents || {}}
        globalProps={globalProps || {}}
        parentState={config.parentState || {}}
    >
        {slotChildren.length ? slotChildren.map((item: GridLayout) => (
            <Runtime
                {...item}
                key={item.i}
                parentHeight={Number(h)}
                customComponents={config.customComponents || {}}
                globalProps={globalProps || {}}
                data={globalData || {}}
                actions={globalActions || {}}
                parentState={config.parentState || {}}
                slotChildren={item.gridLayout || undefined}
            />
        )) : children}
    </Comp>
}) as FC<ComponentConfig & { customComponents: Record<string, ComponentConfig> } & { slotChildren?: GridLayout[], slotGlobalProps?: Record<string, any> }>


export default SubRuntime