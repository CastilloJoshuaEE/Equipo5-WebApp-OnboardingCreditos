// frontend/src/shared/types/api.types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
