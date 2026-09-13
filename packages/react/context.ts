import type { URContext as TURContext, URInjectableActions, URInjectableData } from "core"
import { createContext } from "react"

export const URContext = createContext<TURContext>({ components: {} })

/**
 * Carries the current `data`/`actions` down the tree so any `URRenderer` call
 * inherits them automatically — component authors don't have to remember to
 * re-thread `props.data`/`props.actions` onto every nested `URRenderer`.
 * A node's own `data`/`actions` (if given) extend/override what it inherits,
 * so a subtree can scope in extra values without losing the rest.
 */
export type URDataContextValue = { data: URInjectableData, actions: URInjectableActions }
export const URDataContext = createContext<URDataContextValue>({ data: {}, actions: {} })
