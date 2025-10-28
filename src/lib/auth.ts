import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // CORREÇÃO E DEBUG OBRIGATÓRIO (Adicione o try...catch!)
      async authorize(credentials) {
        console.log("📩 Login tentado:", credentials?.email);
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("❌ Usuário não encontrado no banco"); // Agora ele será executado!
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            (user as any).hashedPassword
          );

          if (!passwordMatch) {
            console.log("❌ Senha incorreta para:", credentials.email); // Agora ele será executado!
            return null;
          }

          console.log("✅ Login OK para:", user.email);
          return user;
        } catch (error) {
          // ESSA É A PARTE MAIS IMPORTANTE PARA O VERCEL: CAPTURAR A FALHA DE CONEXÃO
          console.error("🚨 ERRO FATAL DO PRISMA/DB NO VERCEL:", error);
          return null; // Retorna 401 para o cliente
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },
};
