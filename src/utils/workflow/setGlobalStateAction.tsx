import { FC } from "react"
import { SetGlobalStateAction, WorkflowNodeUIProps, WorkflowReturn, SetGlobalState } from "./types"


const execSetGlobalStateAction = async (action: SetGlobalStateAction, setGlobalState: SetGlobalState): Promise<WorkflowReturn> => {
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
    // if result is string 
    if (typeof result === "string") {
        await setGlobalState(path, value)
    } else {
        await setGlobalState(path, result)
    }
    return { data: result, error: undefined }
}

export const UIEditSetGlobalStateAction: FC<WorkflowNodeUIProps> = ({ values, onChange }) => {
    return <div>
        <input type="text" placeholder="Path" value={values.path} onChange={(e) => onChange("path", e.target.value)} />
        <input type="text" placeholder="Value" value={values.value} onChange={(e) => onChange("value", e.target.value)} />
    </div>
}



export default execSetGlobalStateAction