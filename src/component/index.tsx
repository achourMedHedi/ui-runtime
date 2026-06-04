import Div from "./div"
import ReactTable from "./table"
import { FC, HTMLAttributes } from "react"
import Input from "./input"
import Button from "./button"
import Form from "./form"
import Text from "./text"
import Portal from "./portal"

export { default as Div } from "./div"
export { default as Button } from "./button"
export { default as Text } from "./text"

/** Placeholder for custom component slots. When the runtime has slotChildren it replaces this with the actual content; otherwise this is shown (empty slot or editor). */
const Slot: FC<HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties; className?: string }> = ({ style, className = "", children, ...rest }) => {
    return (
        <div
            {...rest}
            className={`border-2 border-dashed border-slate-300 bg-slate-50/50 min-h-[24px] flex items-center justify-center text-slate-400 text-sm ${className}`.trim()}
            style={style}
        >
            {children ?? "Slot"}
        </div>
    )
}

export const COMPONENTS: Record<string, FC<any>> = {
    div: Div,
    button: Button,
    table: ReactTable,
    input: Input,
    form: Form,
    text: Text,
    portal: Portal,
    slot: Slot
}   