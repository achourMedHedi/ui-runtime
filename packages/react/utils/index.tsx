export const DATA_REF_RE = /\{\{data\.(\w+(?:\.\w+)*)\}\}/g
export const ACTIONS_REF_RE = /^\{\{actions\.(\w+)\}\}$/

export const getByPath = (data: Record<string, any>, path: string) => {
    return path.split(".").reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), data)
}

export const replaceDataRefs = (str: string, data: Record<string, any>) => {
    const matches = [...str.matchAll(DATA_REF_RE)]
    if (matches.length === 0) return str

    // a single, fully-anchored binding resolves to the raw value (preserves type)
    if (matches.length === 1 && matches[0][0] === str) {
        return getByPath(data, matches[0][1])
    }

    // bindings mixed with other text are stringified in place
    return str.replace(DATA_REF_RE, (_match, path) => {
        const value = getByPath(data, path)
        return value === undefined || value === null ? "" : String(value)
    })
}

export const replaceActionsRefs = (str: string, actions: Record<string, Function>) => {
    const match = str.match(ACTIONS_REF_RE)
    if (match) {
        return actions?.[match[1]]
    }
    return str
}

export const isEmptyValue = (value: unknown) => {
    if (value === undefined || value === null || value === "") return true
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === "object") return Object.keys(value).length === 0
    return false
}