import { GetLocalStateAction, WorkflowReturn } from "./types";



const execGetLocalStateAction = async (node: GetLocalStateAction, localState: Record<string, any>) : Promise<WorkflowReturn> => {
    const path = node.config.path
    const func = new Function("state", `
        try {
            return ${path}
        } catch (error) {
            console.error(error)
            return null
        }
    `)
    const result = func(localState)
    return {
        data: result
    }
}

export default execGetLocalStateAction;