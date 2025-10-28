// src/app/api/auth/[...nextauth]/route.ts (ou similar)

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Importa as opções de configuração

// Lógica de URL Dinâmica (Adicionada ao handler para robustez)
const VERCEL_URL = process.env.VERCEL_URL;

// Define a URL de forma robusta:
// 1. Usa NEXTAUTH_URL (definida por você para Produção)
// 2. Usa VERCEL_URL (se for um deploy de Preview)
// 3. Padrão para localhost (Desenvolvimento)
const NEXTAUTH_BASE_URL = process.env.NEXTAUTH_URL 
  ? process.env.NEXTAUTH_URL 
  : VERCEL_URL 
    ? `https://${VERCEL_URL}` 
    : "http://localhost:3000";

// --- Bloco de Criação do Handler do NextAuth ---

// Cria uma cópia das authOptions e adiciona a URL base (se ainda não estiver lá)
// Isso garante que o NextAuth saiba a URL correta para callbacks no Vercel.
const finalAuthOptions = {
    ...authOptions,
    // Garante que a URL é configurada. O NextAuth irá priorizar isso.
    url: NEXTAUTH_BASE_URL
};


const handler = NextAuth(finalAuthOptions);

// Exporta os handlers GET e POST para as rotas da API
export { handler as GET, handler as POST };