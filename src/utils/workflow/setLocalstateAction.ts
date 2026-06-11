import { SetLocalStateAction, WorkflowReturn, SetLocalState } from "./types"


const execSetLocalstateAction = async (action: SetLocalStateAction, setLocalState: SetLocalState): Promise<WorkflowReturn> => {
    const path = action.config.path
    const value = action.config.value
    const func = new Function("context", `
        try {
            return ${value}
        } catch (error) {
            console.error(error)
            return null
        }
    `)
    const result = func(action.context)
    await setLocalState(path, result)
    return { data: result, error: undefined }
}


export default execSetLocalstateAction