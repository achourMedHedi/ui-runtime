import { FC, HTMLAttributes } from "react"



const Form: FC<HTMLAttributes<HTMLFormElement> & { form: any, onSubmit: (data: any) => void, children: React.ReactNode }> = (props) => {
    const { onSubmit, form, children, ...rest } = props
    return <form {...rest} onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(e)
    }}>
        {children}
    </form>

}

export default Form