// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// A variável NEXTAUTH_URL é lida automaticamente pelo NextAuth. 
// Você pode (e deve) removê-la daqui, confiando apenas no .env.local, 
// a menos que precise de uma lógica de fallback muito específica.

/*
// --- Lógica Opcional (se você quer manter o fallback robusto) ---
const VERCEL_URL = process.env.VERCEL_URL;

const NEXTAUTH_BASE_URL = process.env.NEXTAUTH_URL 
  ? process.env.NEXTAUTH_URL 
  : VERCEL_URL 
    ? `https://${VERCEL_URL}` 
    : "http://localhost:3000";

const finalAuthOptions = {
    ...authOptions,
    // Note: Definir "url" geralmente é redundante se NEXTAUTH_URL estiver no .env
    // Mas se quiser manter a lógica de fallback:
    // url: NEXTAUTH_BASE_URL 
};
*/

// Simplificado: Apenas importa e usa as opções
const handler = NextAuth(authOptions);

// Exporta os handlers GET e POST para as rotas da API
export { handler as GET, handler as POST };