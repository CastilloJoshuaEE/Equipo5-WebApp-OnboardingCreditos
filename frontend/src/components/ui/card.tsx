// frontend/src/components/ui/card.tsx
import * as React from "react"
import { Card as MuiCard, CardContent as MuiCardContent, CardHeader as MuiCardHeader, Typography } from "@mui/material"

export const Card = ({ children, className, ...props }: any) => {
  return <MuiCard className={className} {...props}>{children}</MuiCard>
}

export const CardHeader = ({ title, className, ...props }: any) => {
  return <MuiCardHeader title={title} className={className} {...props} />
}

export const CardTitle = ({ children, className, ...props }: any) => {
  return <Typography variant="h6" className={className} {...props}>{children}</Typography>
}

export const CardContent = ({ children, className, ...props }: any) => {
  return <MuiCardContent className={className} {...props}>{children}</MuiCardContent>
}