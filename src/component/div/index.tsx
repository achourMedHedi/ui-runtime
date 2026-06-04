import { HTMLAttributes } from "react"

const Div = (props: DivProps) => { 
    return <div {...props} /> 
}

export type DivProps = HTMLAttributes<HTMLDivElement>

export default Div