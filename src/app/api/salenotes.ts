import { db } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { userId, totalAmount, items } = req.body;

      const saleNote = await db.saleNote.create({
        data: {
          userId,
          totalAmount,
          items,
        },
      });

      res.status(201).json(saleNote);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erro ao criar nota" });
    }
  } else {
    res.status(405).json({ message: "Método não permitido" });
  }
}
