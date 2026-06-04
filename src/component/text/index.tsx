import { Link } from "react-router-dom"
import { BaseChildren } from "../../types"

const Text = (props: { children: BaseChildren[], as?: "span" | "div" }) => {
    const Wrapper = props.as as "span" | "div" || "span"
    return <Wrapper {...props}  >
        {props.children?.map((child, index) => {
            const W = child.as as "span" | "div" || "span"
            if (child.as === "link") return <Link
                key={index} to={child.link || ""}
                className={`
                ${child.className || ""}
            `}
            >
                {child.text}
            </Link>
            return <W
                className={`
                ${child.className || ""}
            `}
                key={index}
            >
                {child.text}
            </W>
        })}
    </Wrapper>
}

export type TextProps = {
    children: BaseChildren[]
    className?: string,
    as?: "span" | "div"
    [key: string]: any
}


export default Text