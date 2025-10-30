import { NextRequest, NextResponse } from "next/server";
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

export async function PUT(req: NextRequest, { params }: any) {
  const { id } = params;
  const body = await req.json();

  const updated = await db.part.update({
    where: { id },
    data: {
      sold: body.sold,
      sellPrice: body.sellPrice,
    },
  });

  return NextResponse.json(updated);
}
