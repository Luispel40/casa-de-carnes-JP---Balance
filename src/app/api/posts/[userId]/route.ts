import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest, context: any) {
  const { userId } = context.params;

  try {
    const posts = await db.post.findMany({
      where: { userId },
      include: { category: true },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    return NextResponse.json({ error: "Erro ao buscar posts" }, { status: 500 });
  }
}
