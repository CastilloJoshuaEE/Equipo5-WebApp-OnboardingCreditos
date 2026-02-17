// frontend/src/features/chatbot/mensaje.types.ts
export interface Mensaje {
  id: string;
  texto: string;
  esUsuario: boolean;
  timestamp: Date;
}
