import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

interface PartInput {
  id?: string;
  name: string;
  weight: number;
  price: number;
  sellPrice?: number;
  isActive?: boolean;
}

interface PostInput {
  id?: string;
  title: string;
  weight: number;
  price: number;
  sellPrice?: number;
  sold?: number;
  isActive: boolean;
  categoryId: string;
  parts?: PartInput[];
}

// 🟢 GET — Lista posts do usuário
export async function GET(req: NextRequest, context: any) {
  const { userId } = context.params;

  try {
    const posts = await db.post.findMany({
      where: { userId },
      include: { parts: true, category: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("❌ Erro ao buscar posts:", error);
    return NextResponse.json({ error: "Erro ao buscar posts" }, { status: 500 });
  }
}

// 🔵 POST — Cria novo post com partes
export async function POST(req: NextRequest, context: any) {
  const { userId } = context.params;
  const body: PostInput = await req.json();

  try {
    const { title, weight, price, sellPrice, isActive, categoryId, parts = [] } = body;

    if (!title || !categoryId) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const newPost = await db.post.create({
      data: {
        title,
        weight,
        price,
        sellPrice: sellPrice ?? 0,
        sold: 0,
        isActive,
        userId,
        categoryId,
        parts: {
          create: parts.map((p) => ({
            name: p.name,
            weight: p.weight,
            price: p.price,
            sellPrice: p.sellPrice ?? 0,
            sold: 0,
            isActive: p.isActive ?? true,
          })),
        },
      },
      include: { parts: true, category: true },
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error("❌ Erro ao criar post:", error);
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 });
  }
}

// 🟠 PUT — Atualiza e faz merge de um post existente
export async function PUT(req: NextRequest, context: any) {
  const { userId } = context.params;
  const body: PostInput = await req.json();

  try {
    const { id, title, weight, price, sellPrice, isActive, categoryId, parts = [] } = body;

    if (!id) return NextResponse.json({ error: "ID do post é obrigatório" }, { status: 400 });

    const existing = await db.post.findUnique({
      where: { id },
      include: { parts: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // 🔹 Merge principal
    const mergedWeight = existing.weight + weight;
    const mergedPrice = (existing.price * existing.weight + price * weight) / mergedWeight;
    const mergedSellPrice =
      ((existing.sellPrice ?? 0) * existing.weight + (sellPrice ?? 0) * weight) / mergedWeight;

    // 🔹 Merge de partes
    const mergedParts: PartInput[] = [...existing.parts.map((p) => ({
      id: p.id,
      name: p.name,
      weight: p.weight,
      price: p.price,
      sellPrice: p.sellPrice ?? 0,
      isActive: p.isActive,
    }))];

    for (const newPart of parts) {
      const existingPart = mergedParts.find((p) => p.name === newPart.name);
      if (existingPart) {
        const totalWeight = existingPart.weight + newPart.weight;
        existingPart.price =
          (existingPart.price * existingPart.weight + newPart.price * newPart.weight) / totalWeight;
        existingPart.sellPrice =
          ((existingPart.sellPrice ?? 0) * existingPart.weight +
            (newPart.sellPrice ?? 0) * newPart.weight) / totalWeight;
        existingPart.weight = totalWeight;
      } else {
        mergedParts.push({
          name: newPart.name,
          weight: newPart.weight,
          price: newPart.price,
          sellPrice: newPart.sellPrice ?? 0,
          isActive: newPart.isActive ?? true,
        });
      }
    }

    // 🔹 Atualiza post e recria as partes
    const updatedPost = await db.post.update({
      where: { id },
      data: {
        title,
        weight: mergedWeight,
        price: mergedPrice,
        sellPrice: mergedSellPrice,
        isActive,
        categoryId,
        userId,
        parts: {
          deleteMany: {},
          create: mergedParts.map((p) => ({
            name: p.name,
            weight: p.weight,
            price: p.price,
            sellPrice: p.sellPrice ?? 0,
            sold: 0,
            isActive: p.isActive ?? true,
          })),
        },
      },
      include: { parts: true, category: true },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("❌ Erro ao atualizar post:", error);
    return NextResponse.json({ error: "Erro ao atualizar post" }, { status: 500 });
  }
}

// 🔴 DELETE — Remove post e partes (cascade)
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });

  try {
    await db.post.delete({ where: { id } });
    return NextResponse.json({ message: "Post deletado com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao deletar post:", error);
    return NextResponse.json({ error: "Erro ao deletar post" }, { status: 500 });
  }
}
