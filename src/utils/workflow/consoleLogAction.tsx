import { ConsoleLogAction, WorkflowNodeUIProps, WorkflowReturn } from "./types"
import { FC } from "react"
import { resolveLogArgs } from "./utils"


const execConsoleLogAction = async (node: ConsoleLogAction): Promise<WorkflowReturn> => {
    console.log(...resolveLogArgs(node?.config?.message, node?.context ?? {}))
    console.log("salem node", node.id, node)
    return {
        data: "success",
        error: undefined
    }
}

export const UIEditConsoleLogAction: FC<WorkflowNodeUIProps> = ({ values, onChange }) => {
    return <div className="flex flex-row gap-2 items-center" >
        <span>Message </span>
        <input type="text" value={values.message} onChange={(e) => onChange("message", e.target.value)} />
    </div>
}



export default execConsoleLogAction