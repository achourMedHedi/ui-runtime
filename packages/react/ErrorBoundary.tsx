import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = {
    id: string
    children: ReactNode
}

type State = {
    error: Error | null
}

const fallbackStyle = {
    padding: "4px 8px",
    fontSize: 12,
    color: "#991b1b",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 6,
} as const

// Wraps every single node (see index.tsx) so a render-time exception in one
// component — a bug in a registered component, a data binding producing a
// type a child can't handle, `Component.props` missing something it assumed
// was there — takes down only that node, not its siblings, its ancestors,
// or the rest of the page. Schema-invalid config is already handled
// separately (URRenderer's own `console.error` + `return null`, before this
// ever mounts) — this is specifically for exceptions during rendering.
class NodeErrorBoundary extends Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[ur] "${this.props.id}" crashed while rendering`, error, info.componentStack)
    }

    componentDidUpdate(prevProps: Props) {
        // Give every new render attempt a clean slate instead of staying
        // stuck on a stale error — if the underlying bug is still there it
        // re-throws and re-catches immediately, so this only costs a wasted
        // render, never a permanently broken node after the config changes.
        if (this.state.error && prevProps.children !== this.props.children) {
            this.setState({ error: null })
        }
    }

    render() {
        if (this.state.error) {
            return (
                <div style={fallbackStyle}>
                    ⚠ "{this.props.id}" failed to render
                </div>
            )
        }
        return this.props.children
    }
}

export default NodeErrorBoundary
