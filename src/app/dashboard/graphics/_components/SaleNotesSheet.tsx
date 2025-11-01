"use client";

import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/_components/ui/sheet";
import { Button } from "@/_components/ui/button";
import { Loader } from "lucide-react";
import { toast } from "sonner";

export default function SaleNotesSheet({ open, setOpen, userId }: any) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/salenotes?userId=${userId}`);
      if (!res.ok) throw new Error("Erro ao buscar notas de venda");
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar notas de venda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchNotes();
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>🧾 Notas de Venda</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader className="animate-spin" /> <span className="ml-2">Carregando...</span>
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Nenhuma nota encontrada.</p>
        ) : (
          <div className="space-y-6 py-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold">Nota #{note.id.slice(0, 6)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(note.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="space-y-2">
                  {note.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span>
                        {item.quantity}kg × R${item.sellPrice.toFixed(2)} ={" "}
                        <strong>R${item.totalPrice.toFixed(2)}</strong>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 mt-3 pt-2 text-right font-semibold">
                  Total: R${note.totalAmount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
