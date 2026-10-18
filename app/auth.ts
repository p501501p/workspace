import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import prisma from "@/app/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // ยืนยันรหัสผ่านโดยเทียบกับ hash ที่เก็บไว้ ไม่เปรียบเทียบรหัสผ่านดิบ
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });

        if (!user || !(await bcrypt.compare(String(credentials.password), user.passwordHash))) {
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
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // เก็บรหัสผู้ใช้และ role ไว้ใน token สำหรับตรวจสอบสิทธิ์ภายหลัง
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // ส่ง id และ role เข้า session เพื่อใช้ตรวจสิทธิ์ในหน้าและ API
        session.user.id = token.id as string;
        session.user.role = (token.role as "ADMIN" | "STAFF" | "USER") ?? "USER";
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
