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
      async authorize(credentials) {
        console.log("📩 Login tentado:", credentials?.email);
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.log("❌ Usuário não encontrado no banco");
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            (user as any).hashedPassword
          );

          if (!passwordMatch) {
            console.log("❌ Senha incorreta para:", credentials.email);
            return null;
          }

          // Remove o hashedPassword do objeto retornado para manter o token pequeno
          const { hashedPassword, ...userWithoutPassword } = user as any; 
          
          console.log("✅ Login OK para:", user.email);
          return userWithoutPassword; // Retorna o objeto limpo
        } catch (error) {
          console.error("🚨 ERRO FATAL DO PRISMA/DB:", error);
          return null; 
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

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },
  
  // NOVO: Reduz o tamanho do nome do cookie
  cookies: {
    sessionToken: {
      name: `app.sid`, // Nome curto para economizar espaço no cabeçalho
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
