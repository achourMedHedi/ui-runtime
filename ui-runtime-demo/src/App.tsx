// @ts-ignore
import { URContext, URRenderer } from "ur-react"
// @ts-ignore
import type { URComponentConfig } from "ur-react"
import { useState, type CSSProperties } from "react";
import Container from "./components/Container"
// Stand-in for a `GET /dashboard-config` response: a plain data payload,
// not something built with JS — the runtime validates each node on its own.
import dashboardConfig from "./dashboard-config.json"

function Div(props: { children?: URComponentConfig[] | string }) {
  if (typeof props.children == "string" ) {
    return props.children
  }
  return (
    props.children?.map(el => <URRenderer {...el} />)
  )
}

function Button(props: { children?: React.ReactNode; onClick?: Function; style?: CSSProperties; type?: "button" | "submit" | "reset" }) {
  return <button type={props.type} style={props.style} onClick={() => props.onClick?.()}>{props.children}</button>
}

const components = { Div, Button, Container }

const config = dashboardConfig as unknown as URComponentConfig<typeof components>

const revenuePresets = ["$48,320", "$52,100", "$44,900"]

function App() {
  const [data, setData] = useState({
    tab: "overview" as "overview" | "details",
    expanded: false,
    revenue: revenuePresets[0],
    revenueIdx: 0,
  })

  const actions = {
    showOverview: () => setData((d) => ({ ...d, tab: "overview" })),
    showDetails: () => setData((d) => ({ ...d, tab: "details" })),
    toggleExpanded: () => setData((d) => ({ ...d, expanded: !d.expanded })),
    refreshRevenue: () =>
      setData((d) => {
        const revenueIdx = (d.revenueIdx + 1) % revenuePresets.length
        return { ...d, revenueIdx, revenue: revenuePresets[revenueIdx] }
      }),
  }

  return (
    <URContext.Provider value={{ components, version: "0.1.0" }}>
        <URRenderer {...config} data={data} actions={actions} />
    </URContext.Provider>
  )
}

export default App
