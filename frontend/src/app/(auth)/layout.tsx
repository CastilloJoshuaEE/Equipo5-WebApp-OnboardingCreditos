// frontend/src/app/(auth)/layout.tsx
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}

// Evitar prerenderizado estático para el layout de auth
export const dynamic = 'force-dynamic';