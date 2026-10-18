import { auth } from "@/app/auth";
import prisma from "@/app/lib/prisma";
import { productSchema } from "@/app/lib/validation";
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
  const validation = productSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }
  const productData = validation.data;

  // ค้นหาสินค้าปัจจุบันด้วยรหัสที่อยู่ใน URL
  const { code: productCode } = await params;
  const product = await prisma.product.findUnique({ where: { code: productCode } });
  // หยุดการแก้ไขเมื่อไม่พบสินค้าตาม code ใน URL
  if (!product) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  // ตรวจว่ารหัสใหม่ไม่ซ้ำกับสินค้าอื่น (ยกเว้นสินค้ารายการนี้เอง)
  const code = productData.code;
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
      name: productData.name,
      category: productData.category,
      price: productData.price,
      quantity: productData.quantity,
      imageUrl: productData.imageUrl ?? null,
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
