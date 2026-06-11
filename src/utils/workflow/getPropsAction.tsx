import { FC } from "react"
import { GetPropsAction, WorkflowNodeUIProps, WorkflowReturn } from "./types"



const execGetPropsAction = async (node: GetPropsAction, props: Record<string, any>) : Promise<WorkflowReturn> => {
    const path = node.config.path
    const func = new Function("props", `
        try {
            return ${path}
        } catch (error) {
            console.error(error)
            return null
        }
    `)
    const result = func(props)
    return {
        data: result
    }
}


export const UIEditGetPropsAction: FC<WorkflowNodeUIProps> = ({ values, onChange }) => {
    return <div>
        <input type="text" placeholder="Path" value={values.path} onChange={(e) => onChange("path", e.target.value)} />
    </div>
}


export default execGetPropsAction;