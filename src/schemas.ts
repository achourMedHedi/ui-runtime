import { z } from "zod"

const VisibleWhenSchema = z.object({
    ref: z.string(),
    equals: z.any().optional(),
    notEquals: z.any().optional(),
    isEmpty: z.boolean().optional(),
})

const ExtraClassNameWhenSchema = VisibleWhenSchema.extend({
    className: z.string().optional(),
})

const anyRecord = z.record(z.string(), z.any())

const LayoutSchema = z.object({
    i: z.string(),
    x: z.number(),
    y: z.union([z.number(), z.string()]),
    w: z.number(),
    h: z.union([z.number(), z.literal("screen"), z.string().regex(/^screen-\d+$/)]),
    totalColumns: z.number().optional(),
    name: z.string().optional(),
})

// GridLayout is recursive — must use z.lazy
const GridLayoutSchema: z.ZodType<any> = z.lazy(() =>
    LayoutSchema.extend({
        globalProps: anyRecord.optional(),
        customComponent: z.string().optional(),
        gridLayout: z.array(GridLayoutSchema),
        component: z.string(),
        props: anyRecord,
        visibleWhen: VisibleWhenSchema.optional(),
        extraClassNamesWhen: z.array(ExtraClassNameWhenSchema).optional(),
        slotChildren: z.array(GridLayoutSchema).optional(),
    })
)

const WorkflowNodeSchema = z.object({
    id: z.string(),
    type: z.string(),
    config: z.any(),
    context: anyRecord.optional(),
    error: z.string().optional(),
})

const workflowConnectionSchema = z.record(z.string(), z.array(z.string()))

const WorkflowSchema = z.object({
    nodes: z.record(z.string(), z.array(WorkflowNodeSchema)),
    startNodes: z.array(z.string()),
    connections: workflowConnectionSchema,
})

export const ComponentConfigSchema: z.ZodType<any> = z.lazy(() => LayoutSchema.extend({
    i: z.string(),
    component: z.string(),

    gridLayout: z.array(GridLayoutSchema),

    //componentState: anyRecord.optional(),

    // custom component props passed from top level and consumed by component the child
    globalProps: anyRecord.optional(),
    
    // component native props
    props: anyRecord,
    
    data: anyRecord.optional(),
    actions: anyRecord.optional(),
    
    visibleWhen: VisibleWhenSchema.optional(),
    extraClassNamesWhen: z.array(ExtraClassNameWhenSchema).optional(),
    
    customComponent: z.string().optional(),

    workflows: z.record(z.string(), WorkflowSchema).optional(),

    customComponents: z.record(z.string(), ComponentConfigSchema).optional(),

}))
