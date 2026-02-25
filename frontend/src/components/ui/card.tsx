// frontend/src/components/ui/card.tsx
import * as React from "react"
import { CardContentProps, CardHeaderProps, CardProps, Card as MuiCard, CardContent as MuiCardContent, CardHeader as MuiCardHeader, Typography, TypographyProps } from "@mui/material"

export const Card = ({ children, className, ...props }: CardProps) => {
  return <MuiCard className={className} {...props}>{children}</MuiCard>
}

export const CardHeader = ({ title, className, ...props }: CardHeaderProps) => {
  return <MuiCardHeader title={title} className={className} {...props} />
}

export const CardTitle = ({ children, className, ...props }: TypographyProps) => {
  return <Typography variant="h6" className={className} {...props}>{children}</Typography>
}

export const CardContent = ({ children, className, ...props }: CardContentProps) => {
  return <MuiCardContent className={className} {...props}>{children}</MuiCardContent>
}