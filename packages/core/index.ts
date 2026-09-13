import { validateComponentConfig } from "./schema.ts"
import type {ComponentConfig, ComponentType, InjectableActions, InjectableData, LayoutConfig, RuntimeContext} from "./types.ts"


export type URComponentConfig<TRegistry extends Record<string, ComponentType<any>> = Record<string, ComponentType<any>>> = ComponentConfig<TRegistry>
export type URContext = RuntimeContext
export type URLayoutConfig = LayoutConfig
export type URComponentType = ComponentType
export type URInjectableData = InjectableData
export type URInjectableActions = InjectableActions

export const URConfigValidator = validateComponentConfig

