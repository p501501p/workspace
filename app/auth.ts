// ใช้ NextAuth จัดการ session และผู้ให้บริการเข้าสู่ระบบ
import NextAuth from "next-auth";
// รองรับการเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
import Credentials from "next-auth/providers/credentials";
// รองรับการเข้าสู่ระบบผ่านบัญชี GitHub
import GitHub from "next-auth/providers/github";
// ใช้ตรวจรหัสผ่านที่ผู้ใช้กรอกกับ hash ที่บันทึกไว้
import bcrypt from "bcryptjs";
// ใช้ Prisma ค้นหาข้อมูลผู้ใช้ในฐานข้อมูล
import prisma from "@/app/lib/prisma";

// ส่งออก handler และฟังก์ชันที่หน้าเว็บ/API ใช้จัดการการยืนยันตัวตน
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // ระบุช่องข้อมูลที่ผู้ใช้ต้องกรอกสำหรับ credentials provider
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        // ปฏิเสธการเข้าสู่ระบบหากไม่มีอีเมลหรือรหัสผ่าน
        if (!credentials?.email || !credentials?.password) return null;

        // ค้นหาบัญชีด้วยอีเมลที่ผู้ใช้ส่งมา
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });

        // ปฏิเสธหากไม่พบบัญชีหรือรหัสผ่านไม่ตรงกับ hash
        if (!user || !(await bcrypt.compare(String(credentials.password), user.passwordHash))) {
          return null;
        }

        // คืนเฉพาะข้อมูลที่ NextAuth ต้องใช้สำหรับผู้ใช้ที่ผ่านการตรวจสอบ
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    GitHub({
      // อ่านค่าประจำตัว OAuth จาก environment variables
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    // เพิ่ม id และ role ลง JWT เมื่อผู้ใช้เข้าสู่ระบบสำเร็จ
    async jwt({ token, user }) {
      if (user) {
        // เก็บรหัสผู้ใช้และ role ไว้ใน token สำหรับตรวจสอบสิทธิ์ภายหลัง
        token.id = user.id;
        token.role = user.role ?? "USER";
      }
      return token;
    },
    // นำ id และ role จาก JWT ไปใส่ใน session ที่แอปนำไปตรวจสิทธิ์
    async session({ session, token }) {
      if (session.user) {
        // ส่ง id และ role เข้า session เพื่อใช้ตรวจสิทธิ์ในหน้าและ API
        session.user.id = token.id as string;
        session.user.role = (token.role as "ADMIN" | "STAFF" | "USER") ?? "USER";
      }
      return session;
    },
  },
  // ใช้หน้าเข้าสู่ระบบของแอปแทนหน้าเริ่มต้นของ NextAuth
  pages: { signIn: "/login" },
  // เก็บ session ในรูปแบบ JWT
  session: { strategy: "jwt" },
});
