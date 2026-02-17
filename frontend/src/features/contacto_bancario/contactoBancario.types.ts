// frontend/src/features/contacto_bancario/contactoBancario.types.ts
export interface ContactoBancario {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  email_contacto?: string;
  telefono_contacto?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactoBancarioData {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  email_contacto?: string;
  telefono_contacto?: string;
  solicitante_id?: string;
}
export interface ContactoBancarioNuevo {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  email_contacto?: string;
  telefono_contacto?: string;
  solicitante_id?: string;
}