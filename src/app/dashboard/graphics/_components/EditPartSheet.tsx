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
import router from "next/router";

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
  handleBaixa: () => Promise<void>;
  availableParts?: any[];
}

export default function EditPartSheet({
  open,
  setOpen,
  soldParts,
  setSoldParts,
}: EditPartSheetProps) {
  const { data: session } = useSession();
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // 🔹 Função auxiliar — incrementa o sold corretamente no banco
  const soldIncrement = async (
    partId: string,
    soldToAdd: number,
    sellPrice: number
  ) => {
    try {
      // Busca a parte atual
      const partRes = await fetch(`/api/parts/${partId}`);
      if (!partRes.ok) throw new Error("Erro ao buscar parte");
      const currentPart = await partRes.json();

      // Calcula novo sold da parte
      const newPartSold = Number(currentPart.sold || 0) + Number(soldToAdd);

      // Atualiza parte com sold incrementado
      const updatePartRes = await fetch(`/api/parts/${partId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sold: newPartSold,
          sellPrice,
          userId: session?.user?.id,
        }),
      });
      if (!updatePartRes.ok) throw new Error("Erro ao atualizar parte");

      // 🔹 Atualiza o sold do post pai de forma incremental (corrigido)
      if (currentPart.postId) {
        const postRes = await fetch(`/api/posts/${currentPart.postId}`);
        if (!postRes.ok) throw new Error("Erro ao buscar post pai");
        const currentPost = await postRes.json();

        const newPostSold = Number(currentPost.sold || 0) + Number(soldToAdd);

        const updatePostRes = await fetch(`/api/posts/updateSold`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: currentPart.postId,
            sold: newPostSold, // ✅ campo correto que a rota espera
          }),
        });

        if (!updatePostRes.ok) throw new Error("Erro ao atualizar post pai");
      }

      return true;
    } catch (error) {
      console.error("Erro em soldIncrement:", error);
      toast.error("Erro ao atualizar venda da parte.");
      return false;
    }
  };

  // Buscar partes disponíveis
  useEffect(() => {
    if (availableParts && availableParts.length > 0) {
      setAvailableParts(availableParts);
      return;
    }

    if (!session?.user?.id) return;

    const fetchParts = async () => {
      try {
        const res = await fetch(`/api/parts?userId=${session.user.id}`);
        if (!res.ok) {
          console.error("Resposta da API:", res.status, res.statusText);
          toast.error("Erro ao buscar partes disponíveis.");
          return;
        }

        const data = await res.json();

        if (!data || data.length === 0) {
          toast.warning("Nenhuma parte disponível encontrada.");
        }

        setAvailableParts(data);
      } catch (err) {
        console.error("Erro no fetchParts:", err);
        toast.error("Erro ao carregar partes.");
      }
    };

    fetchParts();
  }, [availableParts, session]);

  const filteredParts = availableParts.filter(
    (p) =>
      !soldParts.some((s) => s.part.id === p.id) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPart = (part: any) => {
    const safeWeight = Number.isFinite(Number(part.weight))
      ? Number(part.weight)
      : 0;
    const safeSold = Number.isFinite(Number(part.sold)) ? Number(part.sold) : 0;
    const safeSellPrice = Number.isFinite(Number(part.sellPrice))
      ? Number(part.sellPrice)
      : 0;

    setSoldParts((prev) => [
      ...prev,
      {
        part: {
          ...part,
          weight: safeWeight,
          sold: safeSold,
        },
        soldValue: 0,
        sellPrice: safeSellPrice,
      },
    ]);
    setIsPopoverOpen(false);
  };

  const handleSoldChange = (index: number, value: number) => {
    setSoldParts((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const maxAvailable = item.part.weight - (item.part.sold || 0);

      if (isNaN(value)) {
        item.soldValue = 0;
      } else if (value > maxAvailable) {
        toast.warning(`Máximo disponível: ${maxAvailable}kg`);
        item.soldValue = maxAvailable;
      } else if (value < 0) {
        item.soldValue = 0;
      } else {
        item.soldValue = value;
      }

      updated[index] = item;
      return [...updated];
    });
  };

  const handleSellPriceChange = (index: number, value: number) => {
    setSoldParts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], sellPrice: value };
      return [...updated];
    });
  };

  const handleRemovePart = (index: number) => {
    setSoldParts((prev) => prev.filter((_, i) => i !== index));
  };

  // Total geral
  const totalSale = soldParts.reduce(
    (acc, item) => acc + (item.soldValue || 0) * (item.sellPrice || 0),
    0
  );

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
      const saleItems: any[] = [];

      for (const item of soldParts) {
        const { part, soldValue, sellPrice } = item;
        const restante = part.weight - (part.sold || 0);

        if (soldValue <= 0) {
          toast.error(`Quantidade inválida para ${part.name}.`);
          setIsConfirming(false);
          return;
        }
        if (soldValue > restante) {
          toast.error(
            `Você não pode vender mais que ${restante}kg de ${part.name}.`
          );
          setIsConfirming(false);
          return;
        }

        // 🔹 Usa soldIncrement para atualizar corretamente no banco
        const success = await soldIncrement(part.id, soldValue, sellPrice);
        if (!success) throw new Error(`Erro ao atualizar ${part.name}`);

        const totalPrice = soldValue * sellPrice;
        const profit = (sellPrice - (part.price || 0)) * soldValue;

        saleItems.push({
          partId: part.id,
          name: part.name,
          quantity: soldValue,
          sellPrice,
          totalPrice,
          profit,
          isSpecial: part.isSpecial ?? false,
        });

        // Registra a venda individual
        await fetch(`/api/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partId: part.id,
            quantity: soldValue,
            totalPrice,
            profit,
            isSpecial: part.isSpecial ?? false,
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

        {/* Adicionar Parte + Total */}
        <div className="mb-4 flex justify-between items-center">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
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
                      <CommandItem
                        key={part.id}
                        onSelect={() => handleAddPart(part)}
                      >
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

        {/* Lista de Partes */}
        <div className="flex-1 overflow-y-auto border rounded-md max-h-[60vh] p-2 space-y-4">
          {soldParts.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              Nenhuma parte adicionada.
            </div>
          ) : (
            soldParts.map((item, i) => {
              const disponivel = item.part.available ?? 0;
              const isSpecial = item.part.isSpecial;

              return (
                <div
                  key={i}
                  className="border p-3 rounded-md flex flex-col gap-2"
                >
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
                      <Label>Quantidade vendida</Label>
                      <Input
                        type="number"
                        min={0}
                        max={Number.isFinite(disponivel) ? disponivel : 0}
                        value={item.soldValue ?? ""}
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? 0 : Number(e.target.value);
                          handleSoldChange(i, val);
                        }}
                      />

                      <p className="text-xs text-gray-500 mt-1">
                        Disponível: {disponivel} {isSpecial ? "un" : "kg"}
                      </p>
                    </div>
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
            })
          )}
        </div>

        {/* Rodapé */}
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
                      {p.soldValue}{p.part.isSpecial ? "" : "kg de"} {p.part.name} por{" "}
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
