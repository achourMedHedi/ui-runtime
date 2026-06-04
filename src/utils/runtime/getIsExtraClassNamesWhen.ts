import { ExtraClassNameWhen } from "../../types"
import getIsVisible from "./getIsVisible"

const getIsExtraClassNamesWhen = (data: Record<string, any>, props: Record<string, any>, globalProps: Record<string, any>, extraClassNamesWhen: ExtraClassNameWhen[], state: Record<string, any>): string => {
    if (!extraClassNamesWhen || extraClassNamesWhen.length === 0) return ""
    const result = extraClassNamesWhen.filter((item) => {
        return getIsVisible(data, props, globalProps, item, state)
    }).map((item) => item.className).join(" ")
    return result
}

export default getIsExtraClassNamesWhen