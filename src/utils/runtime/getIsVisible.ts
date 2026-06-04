import { get } from "lodash"
import { VisibleWhen } from "../../types"

const getIsVisible = (data: Record<string, any>, props: Record<string, any>, globalProps: Record<string, any>, visibleWhen: VisibleWhen | undefined, state: Record<string, any>) => {
    if (!visibleWhen || !visibleWhen?.ref) return true
    let value = undefined
    if (visibleWhen.ref.includes("props.")) {
        value = get({ data, props }, visibleWhen.ref)
    }
    else if (visibleWhen.ref.includes("globalProps.")) {
        value = get({ data, globalProps }, visibleWhen.ref)
    }
    else if (visibleWhen.ref.includes("state.")) {
        value = get({ data, state }, visibleWhen.ref)
    }
    else {
        value = get({ data }, visibleWhen.ref)
    }
    if (visibleWhen.equals !== undefined) {
        if (typeof value === "boolean" || value === "true" || value === "false") {
            value = value === "true" ? true : value === "false" ? false : value
            return Boolean(value) === Boolean(visibleWhen.equals)
        }
        return value === visibleWhen.equals
    }
    if (visibleWhen.notEquals !== undefined) {
        return value !== visibleWhen.notEquals
    }
    if (visibleWhen.isEmpty !== undefined) {
        return !!!value
    }
    return false
}

export default getIsVisible