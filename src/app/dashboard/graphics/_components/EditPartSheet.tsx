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
  DialogDescription,
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
  handleBaixa,
}: EditPartSheetProps) {
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Buscar partes disponíveis na API
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
      if (value > item.part.weight - (item.part.sold || 0)) return updated;
      item.soldValue = value;
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="px-6 flex flex-col max-h-screen">
        <SheetHeader>
          <SheetTitle>Editar Vendas de Partes</SheetTitle>
          <SheetDescription>
            Adicione e ajuste as partes vendidas.
          </SheetDescription>
        </SheetHeader>

        {/* Adicionar nova parte */}
        <div className="mb-4">
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
        </div>

        {/* Lista de partes adicionadas */}
        <div className="flex-1 overflow-y-auto border rounded-md max-h-[60vh] p-2 space-y-4">
          {soldParts.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              Nenhuma parte adicionada.
            </div>
          )}

          {soldParts.map((item, i) => (
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
                    max={item.part.weight - (item.part.sold || 0)}
                    value={item.soldValue}
                    onChange={(e) =>
                      handleSoldChange(i, Number(e.target.value))
                    }
                  />
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
                />
              </div>
            </div>
          ))}
        </div>

        {/* Botões fixos */}
        <SheetFooter className="mt-4 sticky bottom-0 bg-white border-t pt-3 flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="flex items-center gap-2">
                Confirmar <DollarSign className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Você tem certeza?</DialogTitle>
                <DialogDescription>
                  Confirme a baixa das partes selecionadas:
                  <ul className="mt-2 list-disc list-inside">
                    {soldParts.map((p, i) => (
                      <li key={i}>
                        {p.soldValue}kg de {p.part.name} por{" "}
                        {formatCurrency(p.sellPrice)}
                      </li>
                    ))}
                  </ul>
                </DialogDescription>
              </DialogHeader>
              <DialogClose asChild>
                <Button onClick={handleBaixa}>Confirmar</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
