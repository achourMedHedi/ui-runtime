import { GlobalStateAction, WorkflowReturn, GlobalState } from "./types";
import _ from "lodash"

const execGetGlobalStateAction = async (action: GlobalStateAction, globalState: GlobalState ): Promise<WorkflowReturn>  => {
    
    const path = action.config.path;
    return {data:  _.get(globalState, path, undefined), error: undefined}
}

export default execGetGlobalStateAction