import { z } from "zod";

export const productSchema = z.object({
  code: z.string().trim().min(1, "กรุณากรอกรหัสสินค้า").max(30, "รหัสสินค้าต้องไม่เกิน 30 ตัวอักษร"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า").max(100, "ชื่อสินค้าต้องไม่เกิน 100 ตัวอักษร"),
  category: z.string().trim().min(1, "กรุณากรอกหมวดหมู่").max(50, "หมวดหมู่ต้องไม่เกิน 50 ตัวอักษร"),
  price: z.number().int("ราคาต้องเป็นจำนวนเต็ม").min(0, "ราคาต้องไม่ติดลบ"),
  quantity: z.number().int("จำนวนสินค้าต้องเป็นจำนวนเต็ม").min(0, "จำนวนสินค้าต้องไม่ติดลบ"),
  imageUrl: z
    .string()
    .trim()
    .max(2048, "URL รูปภาพต้องไม่เกิน 2048 ตัวอักษร")
    .refine((value) => {
      if (!value) return true;

      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "URL รูปภาพต้องเป็น HTTP หรือ HTTPS ที่ถูกต้อง")
    .transform((value) => value || null)
    .nullable()
    .optional(),
});
