import { FC, memo, useMemo } from "react"
import { ComponentConfig, GridLayout } from "./types"
import { COMPONENTS } from "./component"
import replaceGlobalProps from "./utils/runtime/replaceGlobalProps"
import replaceData from "./utils/runtime/replaceData"
import replaceChildren from "./utils/runtime/replaceChildren"
import getIsVisible from "./utils/runtime/getIsVisible"
// import replaceStateData from "./utils/runtime/replaceStateData";
import getIsExtraClassNamesWhen from "./utils/runtime/getIsExtraClassNamesWhen";
import SubRuntime from "./SubRuntime";



const Runtime: FC<ComponentConfig & { customComponents: Record<string, ComponentConfig>, slotChildren?: GridLayout[], slotGlobalProps?: Record<string, any> }> = memo((initConfig) => {
    let config = initConfig
    // Only the "pinned" parent that has componentState owns the state (single useState for the whole tree).
    // All other Runtime instances consume state from props (initConfig.parentState).
    // const isStateOwner = Boolean(initConfig.setState && Object.keys(initConfig.setState).length > 0)


    // const [ownedState, setOwnedState] = useState<Record<string, any>>(() => (replaceStateData(initConfig.componentState || {}, config.globalProps || {}, initConfig.data || {}) ?? {}))
    // const componentStateAsProps = isStateOwner ? ownedState : (initConfig.parentState ?? {})
    const componentStateAsProps = initConfig.parentState ?? {}
    const globalData = initConfig.data || {}

    let globalActions = useMemo(() => {
        const newActions = { ...initConfig.actions || {} }
        return newActions
    }, [ initConfig.actions])

    const componentID = config.customComponent || config.component
    // const { formRegister, formWatch, formErrors } = useBuilderFormBridge()
    let Comp = { ...COMPONENTS }[componentID] as FC<any>
    if (!Comp) {
        const customComponentData = config.customComponent && config.customComponents[config.customComponent]
        if (customComponentData) {
            config = { ...customComponentData, globalProps: initConfig.globalProps || {}, x: initConfig.x, y: initConfig.y, w: initConfig.w, h: initConfig.h, customComponents: initConfig.customComponents || {} }
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
                        parentState={componentStateAsProps || {}}
                        slotChildren={initConfig.gridLayout}
                        slotGlobalProps={globalProps}
                    />
                </div>
            )
        }

    }

    const { gridLayout, ...rest } = config
    const parentHeight = useMemo(() => config.parentHeight || 0, [config.parentHeight])

    let h = config.h
    if (typeof config.h === "string" && config.h.includes("screen-")) {
        h = window.innerHeight - Number(config.h.replace("screen-", ""))

    } else if (typeof config.h === "string" && config.h.includes("screen")) {
        h = window.innerHeight
    } else {
        h = Number(config.h)
    }
    const totalRows = useMemo(() => gridLayout?.length ? gridLayout.reduce((acc, item) => {
        let y = item.y
        if (typeof item.y === "number" && item.y < 0) {
            y = parentHeight + item.y
        }
        else if (typeof item.y === "string" && item.y.includes("%")) {
            y = Math.round(parentHeight * parseInt(item.y.replace("%", "")) / 100)
        }
        let h = item.h
        if (typeof item.h === "string" && item.h.includes("screen-")) {
            h = window.innerHeight - Number(item.h.replace("screen-", ""))
        } else if (typeof item.h === "string" && item.h.includes("screen")) {
            h = window.innerHeight
        }
        return Math.max(acc, Number(y) + Number(h))
    }, 0) : h, [gridLayout, config.h])

    const globalProps = useMemo(() => replaceGlobalProps(config.globalProps || {}, globalData || {}, globalActions || {}, componentStateAsProps || {}, initConfig.slotGlobalProps || {}), [config.globalProps, globalData, globalActions, componentStateAsProps, initConfig.slotGlobalProps])
    const props = useMemo(() => replaceData(config.props, globalData || {}, globalActions || {}, globalProps || {}, componentStateAsProps || {}), [config.props, globalData, globalActions, globalProps, componentStateAsProps])
    const isVisible = useMemo(() => getIsVisible(globalData || {}, props || {}, globalProps || {}, config.visibleWhen, componentStateAsProps || {}), [globalData, props, globalProps, config.visibleWhen, componentStateAsProps])
    const withExtraClassNameWhen = useMemo(() => getIsExtraClassNamesWhen(globalData || {}, props || {}, globalProps || {}, config.extraClassNamesWhen || [], componentStateAsProps || {}), [globalData, props, globalProps, config.extraClassNamesWhen, componentStateAsProps])
    const children = useMemo(() => config.props?.children ? replaceChildren(config.props?.children, globalData || {}, props || {}, globalProps || {}, componentStateAsProps || {}) : null, [config.props?.children, globalData, props, globalProps, componentStateAsProps])


    if (!Comp) {
        return <div>Component not foun ----- {componentID}</div>
    }
    if (!isVisible) return null

    return (
        // @ts-ignore
        <Comp
            key={config.i}
            {...props as Record<string, any>}
            // className={gridLayout?.length ? ` ${config.props.className || ""}` : config.props.className}
            className={`${config.props.className || ""} ${withExtraClassNameWhen}`}
            style={{
                ...(gridLayout?.length ? {
                    display: "grid",
                    gridTemplateColumns: `repeat(${config.totalColumns || 12}, 1fr)`,
                    gridTemplateRows: `repeat(${Math.max(totalRows, h)}, 1px)`,
                    height: `${h}px`,
                    rowGap: 0,
                    columnGap: 0,
                } : {
                    height: `${h}px`,
                }),
            }}
            {...(config.component === "table" ? ({
                data: globalData || {},
                actions: globalActions || {},
            }) : ({}))}
            customComponents={config.customComponents || {}}
            data={globalData || {}}
            actions={globalActions || {}}
            parentState={componentStateAsProps || {}}
        >
            {gridLayout.length ? gridLayout?.map((item) => {
                if (item.component === "slot" && initConfig.slotChildren?.length) {
                    return <SubRuntime
                        {...item}
                        key={item.i}
                        parentHeight={Number(h)}
                        customComponents={config.customComponents || {}}
                        globalProps={initConfig.slotGlobalProps || item.globalProps || globalProps || {}}
                        data={globalData || {}}
                        actions={globalActions || {}}
                        parentState={componentStateAsProps || {}}
                        component="div"
                        gridLayout={initConfig.slotChildren}
                        totalColumns={item.totalColumns || config.totalColumns}
                    />
                }
                return <SubRuntime
                    {...item}
                    key={item.i}
                    parentHeight={Number(h)}
                    customComponents={config.customComponents || {}}
                    globalProps={item.globalProps || globalProps || {}}
                    data={globalData || {}}
                    actions={globalActions || {}}
                    parentState={componentStateAsProps || {}}
                    slotChildren={item.customComponent ? (item.gridLayout || undefined) : (initConfig.slotChildren || undefined)}
                    slotGlobalProps={item.customComponent
                        ? replaceData(item.globalProps || {}, globalData || {}, globalActions || {}, globalProps || {}, componentStateAsProps || {})
                        : (initConfig.slotGlobalProps || undefined)}
                />
            }) : children}
        </Comp>
    )
}) as FC<ComponentConfig & { customComponents: Record<string, ComponentConfig>, slotChildren?: GridLayout[], slotGlobalProps?: Record<string, any> }>


export default Runtime