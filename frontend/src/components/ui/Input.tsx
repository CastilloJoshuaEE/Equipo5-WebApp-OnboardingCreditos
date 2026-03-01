// frontend/src/components/ui/Input.tsx
'use client';

import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

type Option = { value: string; label: string };

interface TextInputProps<T extends FieldValues>
  extends Omit<TextFieldProps, "name" | "error"> {
  name: Path<T>;
  options?: Option[];
  register?: UseFormRegister<T>;
  error?: string;
}

export default function TextInput<T extends FieldValues>({
  name,
  options = [],
  register,
  error,
  select,
  ...rest
}: TextInputProps<T>) {

  const inputProps = register ? register(name) : {};

  if (select) {
    return (
      <TextField
        select
        {...rest}
        {...inputProps}
        name={name}
        error={!!error}
        helperText={error}
      >
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <TextField
      {...rest}
      {...inputProps}
      name={name}
      error={!!error}
      helperText={error}
    />
  );
}