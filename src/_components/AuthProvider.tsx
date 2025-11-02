"use client";

// Este componente é o Client Component que fornecerá o contexto de sessão
// para toda a sua aplicação. Ele deve ser importado e usado em src/app/layout.tsx.

import { SessionProvider } from "next-auth/react";

/**
 * @description Wrapper client-side para o NextAuth/Auth.js. 
 * É essencial para que useSession() e signIn() funcionem corretamente.
 * @param children Os componentes filhos da aplicação.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // O componente SessionProvider envolve toda a aplicação, permitindo que os hooks de autenticação
  // funcionem em qualquer Client Component aninhado.
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
