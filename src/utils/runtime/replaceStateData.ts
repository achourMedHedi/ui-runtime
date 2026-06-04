import { get } from "lodash"

// the idea to see the state value if its contain {{globalProps.path}} we go to globalProps and get the value then if the that globalProps value is {{data.path}} is generic we replace it with data value
const replaceStateData = (state: Record<string, any>, globalProps: Record<string, any>, data: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {}

    const resolveString = (str: string): any => {
        // 1) Resolve {{globalProps.path}} from globalProps
        let resolved = str
        const globalMatches = str.match(/\{\{globalProps\.[^}]+\}\}/g)
        if (globalMatches) {
            globalMatches.forEach((match) => {
                const path = match.replace(/\{\{globalProps\./, "").replace(/\}\}/, "")
                const value = get(globalProps, path)
                resolved = resolved.replace(match, value !== undefined && value !== null ? String(value) : "")
            })
        }
        // 2) Resolve {{data.path}} from data (so generic refs in globalProps values get replaced)
        const dataMatches = resolved.match(/\{\{data\.[^}]+\}\}/g)
        if (dataMatches) {
            if (dataMatches.length === 1 && resolved.trim() === dataMatches[0]) {
                const path = dataMatches[0].replace(/\{\{data\./, "").replace(/\}\}/, "")
                return get(data, path)
            }
            dataMatches.forEach((match) => {
                const path = match.replace(/\{\{data\./, "").replace(/\}\}/, "")
                const value = get(data, path)
                resolved = resolved.replace(match, value !== undefined && value !== null ? String(value) : "")
            })
        }
        return resolved
    }

    const resolveValue = (value: any): any => {
        if (typeof value === "string") {
            return resolveString(value)
        }
        if (Array.isArray(value)) {
            return value.map(resolveValue)
        }
        if (value !== null && typeof value === "object") {
            const obj: Record<string, any> = {}
            for (const k of Object.keys(value)) {
                obj[k] = resolveValue(value[k])
            }
            return obj
        }
        return value
    }

    for (const key of Object.keys(state)) {
        result[key] = resolveValue(state[key])
    }
    return result
}

export default replaceStateData