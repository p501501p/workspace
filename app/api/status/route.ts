// GET /api/status: ตรวจสอบว่าแอปพลิเคชันพร้อมตอบคำขอ
export async function GET() {
  return Response.json({ status: "ok" });
}
