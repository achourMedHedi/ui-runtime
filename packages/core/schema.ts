import { z } from "zod"
import type { ComponentConfig } from "./types.ts"



const layoutHeightSchema = z.union([
    z.number(),
    z.literal("screen"),
    z.templateLiteral(["screen-", z.number().int(), "px"]),
    z.templateLiteral(["screen-", z.number().int(), "%"]),
])

const gridLayoutConfigSchema = z.object({
    engine: z.literal("grid"),
    columns: z.number().optional(),
    rowHeight: z.number().optional(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: layoutHeightSchema,
})

const flexLayoutConfigSchema = z.object({
    engine: z.literal("flex"),
    direction: z.enum(["row", "column"]).optional(),
    wrap: z.boolean().optional(),
    gap: z.number().optional(),
    align: z.enum(["start", "center", "end", "stretch", "baseline"]).optional(),
    justify: z.enum(["start", "center", "end", "space-between", "space-around", "space-evenly"]).optional(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: layoutHeightSchema,
})

const layoutConfigSchema = z.discriminatedUnion("engine", [gridLayoutConfigSchema, flexLayoutConfigSchema])

const injectableDataValueSchema: z.ZodType<any> = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.undefined(),
        z.array(injectableDataValueSchema),
        z.record(z.string(), injectableDataValueSchema),
    ])
)

const componentVisibleWhenSchema = z.object({
    ref: z.string(),
    equals: z.any().optional(),
    notEquals: z.any().optional(),
    isEmpty: z.boolean().optional(),
})

export const componentConfigSchema: z.ZodType<ComponentConfig> = z.lazy(() =>
    z.object({
        id: z.string(),
        component: z.string(),
        layout: layoutConfigSchema,
        visibleWhen: componentVisibleWhenSchema.optional(),
        children: z.union([z.array(componentConfigSchema), z.string()]).optional(),
        props: z.record(z.string(), z.any()).optional(),
        data: z.record(z.string(), injectableDataValueSchema).optional(),
        actions: z.record(z.string(), z.function()).optional(),
        style: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    })
)

export type ValidationResult =
    | { success: true; data: ComponentConfig }
    | { success: false; errors: z.core.$ZodIssue[] }

export function validateComponentConfig(config: unknown): ValidationResult {
    const result = componentConfigSchema.safeParse(config)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, errors: result.error.issues }
}
