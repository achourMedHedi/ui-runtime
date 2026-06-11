import { Node } from "@xyflow/react"
import { NavigateFunction } from "react-router-dom"


type ActionBase<T extends WorkflowActionTypes, C> = {
    id: string,
    type: T,
    config: C,
    context?: any,
    error?: string
}

export type GlobalState = {
    state: Record<string, any>,
    setState: SetGlobalState,
    navigate: NavigateFunction,
}

export type SetGlobalState = (path: string, value: any) => Promise<void>
export type SetLocalState = (path: string, value: any) => Promise<void>


// export type XyflowNode = Node & {
//     data: Node["data"] & {
//         nodeData: WorkflowNode[]
//     }

// }


export type ApiAction = ActionBase<"apiAction", {
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    headers: Record<string, string>,
    body: string,
    mockData: any
}>

export type IfConditionAction = ActionBase<"ifConditionAction", {
    condition: string, // e.g. "${data.status} === 200"
}>


export type NavigateAction = ActionBase<"navigateAction", {
    url: string,
}>

export type GlobalStateAction = ActionBase<"getGlobalStateAction", {
    path: string
}>

export type SetGlobalStateAction = ActionBase<"setGlobalStateAction", {
    path: string,
    value: any
}>

export type GetLocalstorageAction = ActionBase<"getLocalstorageAction", {
    key: string
}>


export type SetLocalstorageAction = ActionBase<"setLocalstorageAction", {
    key: string,
    value: string
}>

// set local state
export type SetLocalStateAction = ActionBase<"setLocalStateAction", {
    path: string,
    value: any
}>

// get local state
export type GetLocalStateAction = ActionBase<"getLocalStateAction", {
    path: string
}>

// get props
export type GetPropsAction = ActionBase<"getPropsAction", {
    path: string,
}>

// console log
export type ConsoleLogAction = ActionBase<"consoleLogAction", {
    message: string
}>

export type WorkflowNode = ApiAction |
    IfConditionAction |
    NavigateAction |
    GlobalStateAction |
    SetGlobalStateAction |
    GetLocalstorageAction |
    SetLocalstorageAction |
    SetLocalStateAction |
    GetLocalStateAction |
    GetPropsAction |
    ConsoleLogAction

export type workflowConnection = Record<string, string[]>  // key From -> values To

export type WorkflowActionTypes =
    | "apiAction"
    | "ifConditionAction"
    | "navigateAction"
    | "getGlobalStateAction"
    | "setGlobalStateAction"
    | "getLocalstorageAction"
    | "setLocalstorageAction"
    | "setLocalStateAction"
    | "getLocalStateAction"
    | "getPropsAction"
    | "consoleLogAction"

export type WorkflowLifecycleEvents =
    | "onMount"


export type Workflow = {
    lifecycle?: WorkflowLifecycleEvents,
    nodes: Record<string, WorkflowNode[]>,
    startNodes: string[],
    connections: workflowConnection
}

export type WorkflowReturn<T = any> = {
    data?: T,
    error?: string,
}

export enum WorkflowInputTypes {
    STRING = "string"
}



export type WorkflowNodeUIProps = {
    values: Record<string, any>,
    onChange: (key: string, value: any) => void
}