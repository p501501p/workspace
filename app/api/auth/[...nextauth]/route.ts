// นำ handler สำหรับจัดการคำขอเข้าสู่ระบบจากการตั้งค่า NextAuth มาใช้
import { handlers } from "@/app/auth";

// ส่งต่อคำขอ GET และ POST ของ NextAuth ผ่าน API route นี้
export const { GET, POST } = handlers;