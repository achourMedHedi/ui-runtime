import { IfConditionAction, WorkflowReturn } from "./types";


const execIfConditionAction = async (action: IfConditionAction): Promise<WorkflowReturn>  => {
    const context = action.context
    const conditionFn = new Function("context", `
        try {
            return ${action.config.condition}
        } catch (error) {
            // console.error(error)
            return false
        }
    `)
    
    const result = await conditionFn(context)
    
    return {data: result, error: undefined}
}

export default execIfConditionAction