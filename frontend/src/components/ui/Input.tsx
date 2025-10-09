'use client';

import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

interface InputProps<T extends FieldValues> extends Omit<TextFieldProps, 'error'> {
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: string;
}

export default function Input<T extends FieldValues>({ 
  name, 
  register, 
  error, 
  ...props 
}: InputProps<T>) {
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