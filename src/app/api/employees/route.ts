import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, userId, salary, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    const employee = await db.employee.create({
      data: {
        name,
        role,
        salary: parseFloat(salary),
        age: body.age ? parseInt(body.age) : 18,
        user: { connect: { id: userId } },
        permissions: { connect: { id: body.permissions } },
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Erro ao criar Funcionário:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
