import { SetLocalstorageAction, WorkflowReturn } from "./types";



const execSetLocalstorageAction = async (action: SetLocalstorageAction): Promise<WorkflowReturn> => {
    const { key, value } = action.config;
    localStorage.setItem(key, value);
    return { data: { key, value } };
}

export default execSetLocalstorageAction