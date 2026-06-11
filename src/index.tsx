import Runtime from "./Runtime"
import { ComponentConfigSchema } from "./schemas"
import { ComponentConfig } from "./types"


const validateConfig = (config: unknown) => ComponentConfigSchema.safeParse(config)
export { validateConfig, type ComponentConfig }

export default Runtime
