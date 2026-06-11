import { get } from "lodash"


// Splits a message into literal strings and raw resolved values so console.log
// can print objects as inspectable rather than "[object Object]"
export const resolveLogArgs = (text: string, context: Record<string, any>): any[] => {
    if (!text) return [text]
    const parts: any[] = []
    let last = 0
    for (const match of text.matchAll(/{{context\.(.*?)}}/g)) {
        if (match.index! > last) parts.push(text.slice(last, match.index))
        parts.push(get(context, match[1], ""))
        last = match.index! + match[0].length
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts
}