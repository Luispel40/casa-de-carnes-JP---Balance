"use client";

import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/_components/ui/sheet";
import { Button } from "@/_components/ui/button";
import { Loader, FileDown } from "lucide-react";
import { toast } from "sonner";

// Função para gerar PDF simples
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";


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


const handleDownloadPDF = async (note: any) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200], // Bobina térmica 80mm
  });

  const GOOGLE_URL = "https://share.google/abCLXYB5leiWTywz9";

  // === Gerar QR Code ===
  const qrData = await QRCode.toDataURL(GOOGLE_URL, {
    width: 100,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  // === Converter imagens em base64 (async/await seguro) ===
  async function loadImageAsBase64(path: string): Promise<string | null> {
    try {
      const response = await fetch(path);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn(`⚠️ Falha ao carregar imagem ${path}:`, err);
      return null;
    }
  }

  const companyLogo = await loadImageAsBase64("/logo.png");

  renderContent(doc, note, qrData, companyLogo, null);
  doc.save(`nota-venda-${note.id.slice(0, 6)}.pdf`);
};

function renderContent(
  doc: any,
  note: any,
  qrData: string,
  companyLogo: string | null,
  googleLogo: string | null
) {
  let cursorY = 30;

  // === Logo topo ===
  if (companyLogo) {
    doc.addImage(companyLogo, "PNG", 25, 5, 30, 20);
  }

  // === Cabeçalho ===
  doc.setFontSize(13);
  doc.text("NOTA DE VENDA", 40, cursorY, { align: "center" });
  cursorY += 6;

  doc.setFontSize(9);
  doc.text(`Nº: ${note.id.slice(0, 8).toUpperCase()}`, 10, cursorY);
  cursorY += 5;
  doc.text(`Data: ${new Date(note.createdAt).toLocaleString("pt-BR")}`, 10, cursorY);
  cursorY += 5;

  // === Cliente ===
  doc.setFontSize(10);
  doc.text("Cliente:", 10, cursorY);
  doc.setFontSize(9);
  doc.text(note.clientName || "Não informado", 28, cursorY);
  cursorY += 6;

  // === Empresa ===
  doc.setFontSize(9);
  doc.text("Emitente: JP Comércio de Carnes LTDA", 10, cursorY);
  cursorY += 4;
  doc.setFontSize(8);
  doc.text("CNPJ: 43.737.174/0001-44", 10, cursorY);
  cursorY += 4;
  doc.text("R. Ênio Poli, 400 - Jaguaré - São José do Rio Preto/SP", 10, cursorY);
  cursorY += 4;
  doc.text("Tel: (17) 99212-1356", 10, cursorY);
  cursorY += 4;

  // === Linha separadora ===
  doc.setLineWidth(0.3);
  doc.line(8, cursorY, 72, cursorY);
  cursorY += 3;

  // === Itens ===
  const tableColumn = ["Produto", "Qtd", "Unit", "Total"];
  const tableRows = note.items.map((item: any) => [
    item.name,
    `${item.quantity}${item.isSpecial ? "un" : "kg"}`,
    `${item.sellPrice.toFixed(2)}`,
    `${item.totalPrice.toFixed(2)}`,
  ]);

  (autoTable as any)(doc, {
    startY: cursorY,
    head: [tableColumn],
    body: tableRows,
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 1, halign: "center" },
    margin: { left: 8, right: 8 },
    columnStyles: {
      0: { cellWidth: 26, halign: "left" },
      1: { cellWidth: 10 },
      2: { cellWidth: 14, halign: "right" },
      3: { cellWidth: 14, halign: "right" },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // === Total ===
  doc.setFontSize(10);
  doc.text(`TOTAL: R$ ${note.totalAmount.toFixed(2)}`, 10, finalY);
  cursorY = finalY + 10;

  // === QR Code + Google Logo ===
  doc.addImage(qrData, "PNG", 25, cursorY, 30, 30);
  if (googleLogo) {
    doc.addImage(googleLogo, "PNG", 37, cursorY + 11, 6, 6);
  }

  cursorY += 35;
  doc.setFontSize(9);
  doc.text("Nos avalie no Google", 40, cursorY, { align: "center" });
  cursorY += 6;

  // === Rodapé ===
  doc.setFontSize(8);
  doc.text("Obrigado pela preferência!", 40, cursorY, { align: "center" });
  cursorY += 4;
  doc.text("Esta nota não possui valor fiscal.", 40, cursorY, { align: "center" });

}


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
                className="relative border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                {/* Botão de PDF */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => handleDownloadPDF(note)}
                >
                  <FileDown className="h-5 w-5" />
                </Button>

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
                        {item.quantity}{item.isSpecial ? "un" : "kg"} × R${item.sellPrice.toFixed(2)} ={" "}
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
