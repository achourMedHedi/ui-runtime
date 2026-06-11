import { NavigateAction, WorkflowNodeUIProps, WorkflowReturn, GlobalState } from "./types";
import { FC } from "react";


const execNavigateAction = async (action: NavigateAction, navigate: GlobalState["navigate"]): Promise<WorkflowReturn> => {
    const url = action.config.url;
    if (url) {
        // Navigate to the specified URL
        navigate(url);
    } else {
        console.error("NavigateAction: URL is not defined in the action config.");
    }

    return { data: undefined, error: undefined }
}


export const UIEditNavigateAction: FC<WorkflowNodeUIProps> = ({ values, onChange }) => {
    return <div className="flex flex-row gap-2 items-center">
        <span>URL</span>
        <input type="text" value={values.url} onChange={(e) => onChange("url", e.target.value)} />
    </div>
}

export default execNavigateAction