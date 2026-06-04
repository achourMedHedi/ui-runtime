import { FC, HTMLAttributes, useEffect } from "react"
import { UseFormRegister } from "react-hook-form"

type Validation = {
    required?: boolean
}
type Props = HTMLAttributes<HTMLInputElement> & { register: UseFormRegister<any> , name: string, validation?: Validation }
const Input: FC<Props> = (props) => { 
    const { register, name, validation, children, ...rest } = props
    let registerProps = {}
    if (name && register && typeof register === "function") {
        registerProps = register?.(name, validation || {})
    }
    return  <input {...rest} {...registerProps} name={name}  />
 }

export default Input