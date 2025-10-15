// auth/ui/input.tsx
'use client';

import React from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { UseFormRegister, FieldValues, Path } from 'react-hook-form';

type Option = { value: string; label: string };

interface TextInputProps<T extends FieldValues = any> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
  select?: boolean;
  options?: Option[];
  register?: UseFormRegister<T>;
  error?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: any;
}

export default function TextInput<T extends FieldValues = any>({
  name,
  label,
  placeholder,
  fullWidth = true,
  select = false,
  options = [],
  register,
  error,
  ...rest
}: TextInputProps<T>) {
  const inputProps = register ? { ...register(name) } : {};

  return select ? (
    <TextField
      select
      name={name}
      label={label}
      placeholder={placeholder}
      fullWidth={fullWidth}
      size="small"
      variant="outlined"
      error={!!error}
      helperText={error}
      {...inputProps}
      {...rest}
    >
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  ) : (
    <TextField
      name={name}
      label={label}
      placeholder={placeholder}
      fullWidth={fullWidth}
      size="small"
      variant="outlined"
      error={!!error}
      helperText={error}
      {...inputProps}
      {...rest}
    />
  );
}
