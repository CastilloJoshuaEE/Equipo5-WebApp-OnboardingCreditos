'use client';

import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { FieldError } from 'react-hook-form';

// Definimos los tipos que serán inyectados por RHF a través del spread del register(...)
interface RHFProps {
  onChange: (...event: any[]) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<any>;
}

// Interfaz para el componente Input
interface InputProps extends TextFieldProps {
  // Las props de RHF deben ser opcionales ya que el componente puede usarse sin RHF
  error: boolean;
  helperText?: string;
  // Agregamos las propiedades específicas de RHF que vienen del spread
  // Para que TypeScript no nos dé un error de "propiedad faltante" al hacer el spread.
  register?: RHFProps; 
}

// Wrapper para TextField de MUI con integración a RHF (código simple)
const Input: React.FC<InputProps> = ({ 
    error, 
    helperText, 
    register, // Destructuramos para que no se propague como prop MUI
    ...props 
}) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      margin="normal"
      size="small"
      // Esparcimos las propiedades estándar de TextField
      {...props}
      // Esparcimos las propiedades de RHF (onChange, onBlur, name, ref)
      {...register}
      error={error}
      helperText={helperText}
    />
  );
};

export default Input;
