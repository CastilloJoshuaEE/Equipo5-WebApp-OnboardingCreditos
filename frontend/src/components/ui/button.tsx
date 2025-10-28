import * as React from "react"
import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material"

interface ButtonProps extends MuiButtonProps {
  variant?: 'contained' | 'outlined' | 'text'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "contained", ...props }, ref) => {
    return <MuiButton ref={ref} variant={variant} {...props} />;
  }
)

Button.displayName = "Button"