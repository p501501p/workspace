import { auth } from "@/app/auth";
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ code: string }> };

// GET /api/products/[code]: อ่านข้อมูลสินค้ารายชิ้นด้วยรหัสสินค้า
export async function GET(_request: Request, { params }: Context) {
  const session = await auth();
  // ต้องเข้าสู่ระบบก่อนอ่านรายละเอียดสินค้ารายตัว
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { code } = await params;
  // ค้นหาสินค้าด้วย code ซึ่งเป็นรหัสเฉพาะของสินค้า
  const product = await prisma.product.findUnique({ where: { code } });
  // ส่ง 404 หากไม่มีสินค้า code นี้ในฐานข้อมูล
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

// ตรวจสอบข้อมูลที่ใช้สร้างหรือแก้ไขสินค้าให้ตรงตามรูปแบบที่ API รองรับ
function isProduct(data: unknown): data is {
  code: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
} {
  // ตรวจข้อมูลสินค้าฝั่งเซิร์ฟเวอร์ก่อนแก้ไข
  if (typeof data !== "object" || data === null) return false;

  const product = data as Record<string, unknown>;
  return (
    typeof product.code === "string" &&
    product.code.trim().length > 0 &&
    product.code.trim().length <= 30 &&
    typeof product.name === "string" &&
    product.name.trim().length > 0 &&
    product.name.trim().length <= 100 &&
    typeof product.category === "string" &&
    product.category.trim().length > 0 &&
    product.category.trim().length <= 50 &&
    Number.isInteger(product.price) &&
    (product.price as number) >= 0 &&
    Number.isInteger(product.quantity) &&
    (product.quantity as number) >= 0 &&
    isOptionalImageUrl(product.imageUrl)
  );
}

// ตรวจสอบ URL รูปภาพที่ส่งมา; อนุญาตเว้นว่างได้และจำกัดเฉพาะ HTTP/HTTPS
function isOptionalImageUrl(value: unknown): value is string | null | undefined {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string" || value.trim().length > 2048) return false;
  if (value.trim() === "") return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    // ข้อความที่แปลงเป็น URL ไม่ได้ถือว่าไม่ถูกต้อง
    return false;
  }
}

// PUT /api/products/[code]: แก้ไขรายละเอียดสินค้าตาม code ใน URL
export async function PUT(request: Request, { params }: Context) {
  // แก้ไขสินค้าได้เฉพาะผู้ดูแลระบบที่เข้าสู่ระบบแล้ว
  const session = await auth();
  // ยังไม่เข้าสู่ระบบให้ตอบ 401
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  // เข้าสู่ระบบแล้วแต่ไม่ใช่ผู้ดูแลให้ตอบ 403
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }

  let data: unknown;
  try {
    // อ่าน request body ในรูปแบบ JSON
    data = await request.json();
  } catch {
    // ถ้า body ไม่ใช่ JSON ที่ถูกต้อง ให้ตอบกลับว่าโครงสร้างข้อมูลผิด
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  // ตรวจว่าข้อมูลสินค้ามีชนิดและค่าที่ถูกต้องก่อนนำไปใช้แก้ไข
  if (!isProduct(data)) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลสินค้าให้ถูกต้อง" }, { status: 400 });
  }

  // ค้นหาสินค้าปัจจุบันด้วยรหัสที่อยู่ใน URL
  const { code: productCode } = await params;
  const product = await prisma.product.findUnique({ where: { code: productCode } });
  // หยุดการแก้ไขเมื่อไม่พบสินค้าตาม code ใน URL
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  // ตรวจว่ารหัสใหม่ไม่ซ้ำกับสินค้าอื่น (ยกเว้นสินค้ารายการนี้เอง)
  const code = data.code.trim();
  const duplicate = await prisma.product.findFirst({
    where: { code, NOT: { id: product.id } },
  });
  if (duplicate) {
    return NextResponse.json({ error: "รหัสสินค้านี้มีอยู่แล้ว" }, { status: 409 });
  }

  // UPDATE: บันทึกค่าที่ผ่านการตรวจสอบลงฐานข้อมูล
  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: {
      code,
      name: data.name.trim(),
      category: data.category.trim(),
      price: data.price,
      quantity: data.quantity,
      imageUrl: typeof data.imageUrl === "string" && data.imageUrl.trim() ? data.imageUrl.trim() : null,
    },
  });

  // ส่งข้อมูลสินค้าหลังแก้ไขกลับไปให้ client
  return NextResponse.json({ product: updatedProduct });
}

// DELETE /api/products/[code]: ลบสินค้าตาม code หลังตรวจสิทธิ์และตรวจว่ามีอยู่จริง
export async function DELETE(_request: Request, { params }: Context) {
  // ลบสินค้าได้เฉพาะผู้ดูแลระบบที่เข้าสู่ระบบแล้ว
  const session = await auth();
  // ตรวจว่ามี session และ role ผู้ดูแลก่อนลบข้อมูล
  if (!session?.user?.id) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }

  const { code } = await params;
  const product = await prisma.product.findUnique({ where: { code } });
  // ตรวจว่าพบสินค้าก่อนสั่งลบ
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  // DELETE: ลบรายการเมื่อพบสินค้าตาม code ใน URL
  await prisma.product.delete({ where: { id: product.id } });
  // แจ้งผลสำเร็จเมื่อฐานข้อมูลลบรายการแล้ว
  return NextResponse.json({ success: true });
}
