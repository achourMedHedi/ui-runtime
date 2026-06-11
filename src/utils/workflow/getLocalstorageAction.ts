import { GetLocalstorageAction, WorkflowReturn } from "./types";


const execGetLocalstorageAction = async (action: GetLocalstorageAction): Promise<WorkflowReturn<string>> => {
    const { key } = action.config;
    const value = localStorage.getItem(key);
    return { data: value || undefined };
}

export default execGetLocalstorageAction