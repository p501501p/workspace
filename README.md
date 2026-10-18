# Stockroom

เว็บแอปจัดการคลังสินค้า พัฒนาด้วย Next.js, React, TypeScript, Prisma และ PostgreSQL บน Neon

## ความสามารถ

- สมัครสมาชิกและเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน
- เข้าสู่ระบบด้วย GitHub OAuth (เมื่อตั้งค่า OAuth)
- ดูและค้นหารายการสินค้า
- เพิ่ม แก้ไข และลบสินค้าได้สำหรับผู้ดูแลระบบ
- ตรวจสอบข้อมูลสินค้าในฟอร์มและ API ด้วย Zod
- จัดเก็บรหัสผ่านในรูปแบบ hash

## เครื่องมือที่ต้องมี

- Node.js รุ่นที่รองรับ Next.js 16
- npm
- ฐานข้อมูล PostgreSQL เช่น Neon

## เริ่มต้นใช้งาน

1. เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วติดตั้ง dependencies:

   ```powershell
   npm ci
   ```

2. สร้างไฟล์ `.env` ที่โฟลเดอร์หลักของโปรเจกต์ โดยใช้ค่าของฐานข้อมูลและ NextAuth ของคุณ:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
   DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
   AUTH_SECRET="ใส่ค่า secret ที่สร้างขึ้นเอง"
   AUTH_GITHUB_ID="ใส่ GitHub OAuth Client ID"
   AUTH_GITHUB_SECRET="ใส่ GitHub OAuth Client Secret"
   ```

   - `DATABASE_URL` ใช้เชื่อมต่อจากแอปผ่าน Neon pooled connection
   - `DATABASE_URL_UNPOOLED` ใช้กับ Prisma CLI และ migrations
   - `AUTH_SECRET` ใช้ลงนาม session ของ NextAuth
   - `AUTH_GITHUB_ID` และ `AUTH_GITHUB_SECRET` เป็นค่าทางเลือก หากต้องการเปิดล็อกอินผ่าน GitHub
   - ห้าม commit ไฟล์ `.env` หรือเผยแพร่ secrets ขึ้น repository

3. ติดตั้งโครงสร้างฐานข้อมูลตาม migrations:

   ```powershell
   npx prisma migrate deploy --config prisma7.config.ts
   ```

4. เริ่มเซิร์ฟเวอร์สำหรับพัฒนา:

   ```powershell
   npm run dev
   ```

5. เปิด [http://localhost:3000](http://localhost:3000)

## คำสั่งที่ใช้บ่อย

| คำสั่ง | รายละเอียด |
| --- | --- |
| `npm run dev` | เริ่มเซิร์ฟเวอร์สำหรับพัฒนา |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
| `npm run build` | สร้าง Prisma Client และ build แอป |
| `npm run start` | เริ่มแอปจาก production build |
| `npx prisma studio --config prisma7.config.ts` | เปิด Prisma Studio เพื่อดูข้อมูลในฐานข้อมูล |

ก่อน deploy ให้ตั้ง `DATABASE_URL`, `DATABASE_URL_UNPOOLED` และ `AUTH_SECRET` ใน environment variables ของ hosting platform แล้วรัน migrations ด้วย `npx prisma migrate deploy --config prisma7.config.ts` ในขั้นตอน deploy หากใช้ GitHub OAuth ให้ตั้ง `AUTH_GITHUB_ID` และ `AUTH_GITHUB_SECRET` เพิ่มเติม พร้อมกำหนด callback URL ให้ตรงกับโดเมนแอป

## โครงสร้างโปรเจกต์

- `app/` — หน้าเว็บ, API routes และ NextAuth
- `app/api/products/` — API สำหรับอ่าน เพิ่ม แก้ไข และลบสินค้า
- `app/lib/prisma.ts` — Prisma Client ที่เชื่อมต่อ PostgreSQL ผ่าน Neon adapter
- `app/lib/validation.ts` — Zod schema สำหรับตรวจข้อมูลสินค้า
- `prisma/schema.prisma` — Prisma models ของผู้ใช้และสินค้า
- `prisma/migrations-postgres/` — migrations สำหรับ PostgreSQL
