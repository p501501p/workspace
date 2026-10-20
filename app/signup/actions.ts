"use server";

// ใช้ hash รหัสผ่านก่อนบันทึกลงฐานข้อมูล
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/prisma";

// รูปแบบผลลัพธ์ที่ส่งกลับไปยังฟอร์มเมื่อสมัครไม่สำเร็จ
export type SignUpState = { error?: string };

// ตรวจข้อมูลสมัครสมาชิก สร้างบัญชี แล้วเปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ
export async function signUp(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  // อ่านค่าจากฟอร์มและปรับรูปแบบชื่อ/อีเมลให้สม่ำเสมอ
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  // ตรวจช่องที่จำเป็นและข้อกำหนดของรหัสผ่าน
  if (!name || !email || !password || !confirmPassword) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }
  if (password.length < 6 || password.length > 20) return { error: "รหัสผ่านต้องมีความยาวระหว่าง 6 ถึง 20 ตัวอักษร" };
  if (password !== confirmPassword) return { error: "รหัสผ่านไม่ตรงกัน" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "รูปแบบ Email ไม่ถูกต้อง" };
  }

  // ป้องกันการสร้างบัญชีด้วยอีเมลที่มีอยู่แล้ว
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { error: "Email นี้ถูกใช้งานแล้ว" };

  // เข้ารหัสรหัสผ่านและสร้างบัญชีใหม่ด้วยสิทธิ์ผู้ใช้ทั่วไป
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "USER" },
  });

  // สมัครสำเร็จแล้วนำผู้ใช้ไปเข้าสู่ระบบ
  redirect("/login?registered=1");
}
