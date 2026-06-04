import { get } from "lodash"
import { BaseChildren } from "../../types"

const replaceChildren = (children: string | BaseChildren[], data: Record<string, any>, props: Record<string, any>, globalProps: Record<string, any>, state: Record<string, any>) => {
    if (typeof children === "string") {
        return children.replace(/{{data\.[^}]+}}/g, (match) => {
            const path = match.replace("{{data.", "").replace("}}", "")
            return get(data, path)
        }).replace(/{{props\.[^}]+}}/g, (match) => {
            const path = match.replace("{{props.", "").replace("}}", "")
            return get(props, path)
        }).replace(/{{globalProps\.[^}]+}}/g, (match) => {
            const path = match.replace("{{globalProps.", "").replace("}}", "")
            return get(globalProps, path)
        }).replace(/{{state\.[^}]+}}/g, (match) => {
            const path = match.replace("{{state.", "").replace("}}", "")
            return get(state, path)
        })
    }
    // Replace {{data.path}} placeholders in each child's text property
    return children.map((child) => {
        let text = child.text
        // Find all {{data.path}} patterns in the text
        const matches = text.match(/\{\{data\.[^}]+\}\}/g)
        if (matches) {
            matches.forEach((match) => {
                // Extract the path from {{data.path}}
                const path = match.replace("{{data.", "").replace("}}", "")
                const value = get(data, path)
                // Replace the placeholder with the actual value (or empty string if not found)
                text = text.replace(match, value !== undefined ? String(value) : "")
            })
        }
        const matchesProps = text.match(/\{\{props\.[^}]+\}\}/g)
        if (matchesProps) {
            matchesProps.forEach((match) => {
                const path = match.replace("{{props.", "").replace("}}", "")
                const value = get(props, path)
                text = text.replace(match, value !== undefined ? String(value) : "")
            })
        }
        const matchesGlobalProps = text.match(/\{\{globalProps\.[^}]+\}\}/g)
        if (matchesGlobalProps) {
            matchesGlobalProps.forEach((match) => {
                const path = match.replace("{{globalProps.", "").replace("}}", "")
                const value = get(globalProps, path)
                text = text.replace(match, value !== undefined ? String(value) : "")
            })
        }
        const matchesState = text.match(/\{\{state\.[^}]+\}\}/g)
        if (matchesState) {
            matchesState.forEach((match) => {
                const path = match.replace("{{state.", "").replace("}}", "")
                const value = get(state, path)
                text = text.replace(match, value !== undefined ? String(value) : "")
            })
        }
        return {
            ...child,
            text
        }
    })
}

export default replaceChildren