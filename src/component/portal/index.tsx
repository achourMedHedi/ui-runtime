import { FC, HTMLAttributes } from "react"
import { createPortal } from "react-dom"


const Portal: FC<HTMLAttributes<HTMLDivElement>> = (props) => {
    if (typeof document === "undefined") return null
    return createPortal(
        <div {...props} />,
        document.body
    )
}

export default Portal