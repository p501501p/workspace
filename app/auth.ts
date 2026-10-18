import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";

import prisma from "@/app/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ==========================================
    // Login ด้วย Email / Password
    // ==========================================
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user) {
          return null;
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),

    // ==========================================
    // Login ด้วย GitHub
    // ==========================================
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],

  callbacks: {
    // ==========================================
    // JWT
    // ==========================================
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        // Credentials มี role
        if (user.role) {
          token.role = user.role;
        }

        // GitHub user ไม่มี role จาก Credentials
        // ให้ USER เป็นค่าเริ่มต้น
        if (!token.role) {
          token.role = "USER";
        }
      }

      return token;
    },

    // ==========================================
    // Session
    // ==========================================
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        const role = (token.role as "ADMIN" | "STAFF" | "USER") || "USER";
        session.user.role = role;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },
});