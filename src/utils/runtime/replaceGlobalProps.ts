import { get } from "lodash"

const replaceGlobalProps = (globalProps: Record<string, any>, data: Record<string, any>, actions: Record<string, any>, state: Record<string, any>, slotGlobalProps: Record<string, any>): Record<string, any> => {

    let props = { ...globalProps }

    const newProps = Object.keys(props || {}).reduce((acc, key) => {
        if (key === "children") return acc
        if (typeof props[key] === "string" && props[key].includes("{{data.")) {
            const matches = props[key].match(/\{\{data\.[^}]+\}\}/g)
            let result = props[key]
            if (matches?.length && matches.length > 1) {
                matches.forEach((match) => {
                    const path = match.replace("{{data.", "").replace("}}", "")
                    const value = get(data, path)
                    result = result.replace(match, value !== undefined ? String(value) : "")
                })
                return { ...acc, [key]: result }
            }
            const path = props[key].replace("{{data.", "").replace("}}", "")
            const value = get(data, path)
            if (value !== undefined) {
                return { ...acc, [key]: value }
            }
            return acc
        } else if (typeof props[key] === "string" && props[key].includes("{{actions.")) {
            const path = props[key].replace("{{actions.", "").replace("}}", "")
            const value = get(actions, path)
            if (value !== undefined) {
                return { ...acc, [key]: (...args: any[]) => value(state, ...args) }
            }
            return acc
        } // else if slotGlobalProps is not undefined and the keys is in the slotGlobalProps then replace the value with the value of the slotGlobalProps
        else if (slotGlobalProps && Object.keys(slotGlobalProps).includes(key)) {
            return { ...acc, [key]: slotGlobalProps[key] }
        }

        return { ...acc, [key]: props[key] }
    }, {})

    return newProps
}

export default replaceGlobalProps