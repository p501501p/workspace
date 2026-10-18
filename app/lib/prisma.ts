// เชื่อม Prisma Client กับ Neon PostgreSQL ผ่าน serverless adapter
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/app/generated/prisma/client";

// ใช้ pooled URL สำหรับคำขอจากแอป โดยไม่ฝังค่า secret ไว้ใน source
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

// สร้าง Prisma Client เพื่อให้ส่วนต่าง ๆ ของแอปเรียกใช้ฐานข้อมูล
const prisma = new PrismaClient({
  adapter,
});

// ส่งออก client กลางสำหรับนำเข้าไปใช้งานในหน้าและ API
export default prisma;