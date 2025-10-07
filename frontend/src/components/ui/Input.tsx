"use client";

import React from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { UseFormRegister } from "react-hook-form";

interface InputProps extends Omit<TextFieldProps, "error"> {
  name: string;
  register: UseFormRegister<Record<string, unknown>>;
  error?: string;
}

export default function Input({ name, register, error, ...props }: InputProps) {
  return (
    <TextField
      {...register(name)}
      {...props}
      fullWidth
      margin="normal"
      error={!!error}
      helperText={error}
    />
  );
}
