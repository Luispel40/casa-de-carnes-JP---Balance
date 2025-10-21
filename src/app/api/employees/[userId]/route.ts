import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const employees = await db.employee.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(employees);
}
