import { GlobalState, SetGlobalState, SetLocalState, Workflow, WorkflowActionTypes, WorkflowNode, WorkflowReturn } from "./types";
import execApiAction, { UIEditApiAction } from "./apiAction";
import execConsoleLogAction, { UIEditConsoleLogAction } from "./consoleLogAction";
import execGlobalStateAction from "./getGlobalStateAction";
import execGetLocalStateAction from "./getLocalStateAction";
import execGetLocalstorageAction from "./getLocalstorageAction";
import execGetPropsAction, { UIEditGetPropsAction } from "./getPropsAction";
import execIfConditionAction from "./ifConditionAction";
import execNavigateAction, { UIEditNavigateAction } from "./navigateAction";
import execSetGlobalStateAction, { UIEditSetGlobalStateAction } from "./setGlobalStateAction";
import execSetLocalstateAction from "./setLocalstateAction";
import execSetLocalstorageAction from "./setLocalstorage";

const execNode = async (
    node: WorkflowNode,
    globalState?: GlobalState,
    setGlobalState?: SetGlobalState,
    localState?: Record<string, any>,
    setLocalState?: SetLocalState,
    props?: Record<string, any>
): Promise<WorkflowReturn> => {
    // await new Promise(resolve => setTimeout(resolve, 300));
    switch (node.type) {
        case "apiAction":
            return await execApiAction(node)
        case "ifConditionAction":
            return await execIfConditionAction(node)
        case "navigateAction":
            return await execNavigateAction(node, globalState!.navigate)
        case "getGlobalStateAction":
            return await execGlobalStateAction(node, globalState!)
        case "setGlobalStateAction":
            return await execSetGlobalStateAction(node, setGlobalState!)
        case "getLocalstorageAction":
            return await execGetLocalstorageAction(node)
        case "setLocalstorageAction":
            return await execSetLocalstorageAction(node)
        case "setLocalStateAction":
            return await execSetLocalstateAction(node, setLocalState!)
        case "getLocalStateAction":
            return await execGetLocalStateAction(node, localState!)
        case "getPropsAction":
            return await execGetPropsAction(node, props!)
        case "consoleLogAction":
            return await execConsoleLogAction(node)
        default:
            console.error(`Unknown node type `, node)
            throw new Error(`Unknown node type`)
    }

}

const execConnection = async (
    toExecNodes: string[],
    nodes: Record<string, WorkflowNode[]>,
    context: Record<string, WorkflowReturn> = {},
    globalState: GlobalState,
    setGlobalState: SetGlobalState,
    localState: Record<string, any>,
    setLocalState: SetLocalState,
    props: Record<string, any>
): Promise<Record<string, WorkflowReturn>> => {
    const results: Record<string, WorkflowReturn> = {};

    let nodesDetails = []
    for (const nodeId of toExecNodes) {
        const node = nodes[nodeId];
        if (Array.isArray(node)) {
            nodesDetails.push(...node);
        } else {
            nodesDetails.push(node);
        }
    }


    if (nodesDetails.length) {
        await Promise.all(
            nodesDetails.map(async (node: WorkflowNode) => {
                if (node) {
                    // Optionally pass context into the node exec
                    const data = await execNode({
                        ...node,
                        context
                    },
                        globalState, setGlobalState,
                        localState, setLocalState,
                        props);
                    results[node.id] = data;
                } else {
                    console.warn(`Node with id "${node}" not found.`);
                }
            })
        );
    }

    return results;
}


export type ExecWorkflowProps = {
    workflow: Workflow,
    globalState: GlobalState,
    localState: Record<string, any>,
    setLocalState: SetLocalState,
    props: Record<string, any>,
}
export default async function execWorkflow({ workflow, globalState, localState, setLocalState, props }: ExecWorkflowProps) {
    const formatetedNodes: Record<string, WorkflowNode[]> = Object.entries(workflow.nodes).reduce((acc, [id, node]) => {
        acc[id] = node 
        return acc
    }, {} as Record<string, WorkflowNode[]>)
    const executionResults: Record<string, WorkflowReturn> = {};
    const startNodesResult = await execConnection(workflow.startNodes, formatetedNodes, {}, globalState, globalState.setState, localState, setLocalState, props);
    Object.assign(executionResults, startNodesResult);
    let connectionsFrom = workflow.startNodes
    while (connectionsFrom.length > 0) {
        const nextConnections: string[] = [];

        for (const connectionFrom of connectionsFrom) {
            const node = workflow.nodes[connectionFrom];
            
            const fromData = executionResults[connectionFrom];
            const prevConnectionType = node?.[0]?.type
            // Skip if it's a false condition from ifConditionAction
            if (prevConnectionType === "ifConditionAction" && fromData.data === false) {
                continue;
            }

            // Get the next nodes to execute from connections
            const nextNodes = workflow.connections[connectionFrom];
            if (nextNodes) {
                const results = await execConnection(nextNodes, formatetedNodes, executionResults, globalState, globalState.setState, localState, setLocalState, props);
                Object.assign(executionResults, results);
                nextConnections.push(...nextNodes);
            }
        }

        // Update connections for next iteration
        connectionsFrom = nextConnections;
    }

    return executionResults;
}




// @ts-ignore
export const EditWorkflowNodeFieldsUIComponents: Record<WorkflowActionTypes, React.FC<any>> = {
    "consoleLogAction": UIEditConsoleLogAction,
    "navigateAction": UIEditNavigateAction,
    "apiAction": UIEditApiAction,
    "setGlobalStateAction": UIEditSetGlobalStateAction,
    "getPropsAction": UIEditGetPropsAction
}