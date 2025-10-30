import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await db.part.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar parte:", error);
    return NextResponse.json({ error: "Erro ao deletar parte" }, { status: 500 });
  }
}
