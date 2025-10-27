import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.$connect();
    await db.user.count(); // tenta uma query simples
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  } finally {
    await db.$disconnect();
  }
}
