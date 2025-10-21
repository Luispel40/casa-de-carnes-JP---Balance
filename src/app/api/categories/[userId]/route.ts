import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const categories = await db.category.findMany({
    where: { userId: params.userId },
    include: {
      posts: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(categories);
}
