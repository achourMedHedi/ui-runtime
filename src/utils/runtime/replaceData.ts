import { get } from "lodash"

const replaceData = (props: Record<string, any>, data: Record<string, any>, actions: Record<string, any>, globalProps: Record<string, any>, state: Record<string, any>): Record<string, any> => {


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
        } else if (typeof props[key] === "string" && props[key].includes("{{props.")) {

            const path = props[key].replace("{{props.", "").replace("}}", "")
            const value = get(props, path)
            if (value !== undefined) {
                return { ...acc, [key]: value }
            }
            return acc
        } else if (typeof props[key] === "string" && props[key].includes("{{globalProps.")) {

            const path = props[key].replace("{{globalProps.", "").replace("}}", "")
            const value = get(globalProps, path)
            if (value !== undefined) {
                return { ...acc, [key]: value }
            }
            return acc
        } else if (typeof props[key] === "string" && props[key].includes("{{state.")) {
            const path = props[key].replace("{{state.", "").replace("}}", "")
            const value = get(state, path)
            if (value !== undefined) {
                return { ...acc, [key]: value }
            }
            return acc
        }
        return { ...acc, [key]: props[key] }
    }, {})

    return newProps
}

export default replaceData