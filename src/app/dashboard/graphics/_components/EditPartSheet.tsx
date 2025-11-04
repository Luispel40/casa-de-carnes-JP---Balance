"use client";
import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/_components/ui/sheet";
import { Button } from "@/_components/ui/button";
import { Label } from "@/_components/ui/label";
import { Input } from "@/_components/ui/input";
import { DollarSign, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/_components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/_components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/_components/ui/popover";
import { toast } from "sonner";
import { formatCurrency } from "@/helpers/format-currency";
import { playSound } from "utils/play-sound";
import { useSession } from "next-auth/react";

interface EditPartSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  soldParts: Array<{
    part: any;
    soldValue: number;
    sellPrice: number;
  }>;
  setSoldParts: React.Dispatch<
    React.SetStateAction<
      Array<{
        part: any;
        soldValue: number;
        sellPrice: number;
      }>
    >
  >;
  fillAllRemaining: (index: number) => void;
  handleBaixa: () => void;
}

export default function EditPartSheet({
  open,
  setOpen,
  soldParts,
  setSoldParts,
  fillAllRemaining,
}: EditPartSheetProps) {
  const { data: session } = useSession();
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // 🔹 Buscar partes disponíveis
  useEffect(() => {
    async function fetchParts() {
      try {
        const res = await fetch("/api/parts");
        const data = await res.json();
        setAvailableParts(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao buscar partes disponíveis.");
      }
    }
    fetchParts();
  }, []);

  const filteredParts = availableParts.filter(
    (p) =>
      !soldParts.some((s) => s.part.id === p.id) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPart = (part: any) => {
    setSoldParts((prev) => [
      ...prev,
      {
        part,
        soldValue: 0,
        sellPrice: part.sellPrice || 0,
      },
    ]);
    setIsPopoverOpen(false);
  };

  const handleSoldChange = (index: number, value: number) => {
    setSoldParts((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const maxAvailable = item.part.weight - (item.part.sold || 0);

      if (value > maxAvailable) {
        toast.warning(`Máximo disponível: ${maxAvailable}kg`);
        item.soldValue = maxAvailable;
      } else if (value < 0) {
        item.soldValue = 0;
      } else {
        item.soldValue = value;
      }
      return updated;
    });
  };

  const handleSellPriceChange = (index: number, value: number) => {
    setSoldParts((prev) => {
      const updated = [...prev];
      updated[index].sellPrice = value;
      return updated;
    });
  };

  const handleRemovePart = (index: number) => {
    setSoldParts((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔹 Calcular total da venda
  const totalSale = soldParts.reduce(
    (acc, item) => acc + item.soldValue * item.sellPrice,
    0
  );

  // 🔹 Confirmar venda
  const handleConfirmSale = async () => {
    if (!session?.user?.id) {
      toast.error("Usuário não autenticado.");
      return;
    }

    if (soldParts.length === 0) {
      toast.error("Adicione pelo menos uma parte.");
      return;
    }

    setIsConfirming(true);

    try {
      const saleItems: {
        partId: string;
        name: string;
        quantity: number;
        sellPrice: number;
        totalPrice: number;
        profit: number;
      }[] = [];

      for (const item of soldParts) {
        const { part, soldValue, sellPrice } = item;

        if (soldValue <= 0) {
          toast.error(`Quantidade inválida para ${part.name}.`);
          setIsConfirming(false);
          return;
        }

        const restante = part.weight - (part.sold || 0);
        if (soldValue > restante) {
          toast.error(
            `Você não pode vender mais que ${restante}kg de ${part.name}.`
          );
          setIsConfirming(false);
          return;
        }

        // Atualiza parte
        const partRes = await fetch(`/api/parts/${part.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sold: (part.sold || 0) + soldValue,
            sellPrice,
          }),
        });
        if (!partRes.ok) throw new Error(`Erro ao atualizar ${part.name}`);

        const totalPrice = soldValue * sellPrice;
        const profit = (sellPrice - (part.price || 0)) * soldValue;

        saleItems.push({
          partId: part.id,
          name: part.name,
          quantity: soldValue,
          sellPrice,
          totalPrice,
          profit,
        });

        // Registra venda individual
        await fetch(`/api/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partId: part.id,
            quantity: soldValue,
            totalPrice,
            profit,
          }),
        });

        // Corrigido: Atualiza post pai corretamente
        await fetch(`/api/posts/${part.postId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sold: (part.postSold || 0) + soldValue,
          }),
        });
      }

      // Cria nota de venda
      const notaRes = await fetch("/api/salenotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          totalAmount: totalSale,
          items: saleItems,
        }),
      });

      if (!notaRes.ok) throw new Error("Erro ao criar nota de venda");

      toast.success("Venda registrada e nota gerada com sucesso!");
      playSound("/sounds/cash-register.mp3");
      setSoldParts([]);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar baixa.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="px-6 flex flex-col max-h-screen">
        <SheetHeader>
          <SheetTitle>Editar Vendas de Partes</SheetTitle>
          <SheetDescription>
            Adicione e ajuste as partes vendidas.
          </SheetDescription>
        </SheetHeader>

        {/* 🔹 Adicionar parte e total */}
        <div className="mb-4 flex justify-between items-center">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Plus size={16} /> Adicionar Parte
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64">
              <Command>
                <CommandInput
                  placeholder="Pesquisar parte..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  {filteredParts.length > 0 ? (
                    filteredParts.map((part) => (
                      <CommandItem key={part.id} onSelect={() => handleAddPart(part)}>
                        {part.name}
                      </CommandItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      Nenhum resultado
                    </div>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <span className="text-gray-700 font-semibold">
            Total: {formatCurrency(totalSale)}
          </span>
        </div>

        {/* 🔹 Lista de partes */}
        <div className="flex-1 overflow-y-auto border rounded-md max-h-[60vh] p-2 space-y-4">
          {soldParts.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              Nenhuma parte adicionada.
            </div>
          )}

          {soldParts.map((item, i) => {
            const disponivel = (Number(item.part.weight) - (item.part.sold ?? 0));
            return (
              <div key={i} className="border p-3 rounded-md flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <strong>{item.part.name}</strong>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleRemovePart(i)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1">
                    <Label>Quantidade vendida (kg)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={disponivel}
                      value={item.soldValue ?? 0}
                      onChange={(e) =>
                        handleSoldChange(i, Number(e.target.value))
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Disponível: {disponivel}kg
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-1"
                    onClick={() => fillAllRemaining(i)}
                  >
                    Tudo
                  </Button>
                </div>

                <div>
                  <Label>Preço de venda (R$)</Label>
                  <Input
                    type="number"
                    value={item.sellPrice}
                    onChange={(e) =>
                      handleSellPriceChange(i, Number(e.target.value))
                    }
                    disabled
                  />
                </div>

                <p className="text-sm font-medium text-right mt-2">
                  Subtotal:{" "}
                  {formatCurrency(item.soldValue * item.sellPrice || 0)}
                </p>
              </div>
            );
          })}
        </div>

        {/* 🔹 Rodapé */}
        <SheetFooter className="mt-4 sticky bottom-0 bg-white border-t pt-3 flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="default"
                className="flex items-center gap-2"
                disabled={soldParts.length === 0}
              >
                Confirmar <DollarSign className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar venda</DialogTitle>
              </DialogHeader>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Confirme a baixa das partes selecionadas:
                </p>

                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {soldParts.map((p, i) => (
                    <li key={i}>
                      {p.soldValue}kg de {p.part.name} por{" "}
                      {formatCurrency(p.sellPrice)}
                    </li>
                  ))}
                </ul>

                <div className="mt-2 font-semibold">
                  Total: {formatCurrency(totalSale)}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <DialogClose asChild>
                  <Button onClick={handleConfirmSale} disabled={isConfirming}>
                    {isConfirming ? "Gerando nota..." : "Confirmar"}
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
