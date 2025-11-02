"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/_components/ui/button";
import {
  Trash,
  Edit,
  DollarSign,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import { Input } from "@/_components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/_components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/_components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/_components/ui/command";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/helpers/format-currency";

interface PartsTableProps {
  userId: string;
  parts: any[];
  posts: any[];
  handleOpenEditSheet: (part: any) => void;
  handleDeletePart: (id: string, name: string) => void;
  handleUpdateSellPrice?: (id: string, newSellPrice: number) => void;
  selectedPost: string
  setSelectedPost: React.Dispatch<React.SetStateAction<string>>
}

export default function PartsTable({
  userId,
  parts,
  handleOpenEditSheet,
  handleDeletePart,
  handleUpdateSellPrice,
}: PartsTableProps) {
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [openCombo, setOpenCombo] = useState(false);
  const [percentages, setPercentages] = useState<{ [key: string]: string }>({});
  const [reductionValues, setReductionValues] = useState<{
    [key: string]: { name: string; weight: string; percent?: string };
  }>({});
  const [openDialog, setOpenDialog] = useState<{
    id: string | null;
    type: "adjust" | "reduce" | null;
  }>({ id: null, type: null });

  // 🔹 Agrupar as partes do usuário logado
  const groupedParts = useMemo(() => {
    if (!Array.isArray(parts)) return [];

    const userParts = parts.filter(
      (p) =>
        p.userId === userId &&
        p.name.toLowerCase() !== "quebra" &&
        p.weight - (p.sold || 0) > 0
    );

    const groups: Record<
      string,
      {
        id: string;
        name: string;
        totalWeight: number;
        totalSold: number;
        sellPrice: number;
        price: number;
        postId: string;
        isActive: boolean;
      }
    > = {};

    for (const part of userParts) {
      const key = part.name.trim().toLowerCase();
      if (!groups[key]) {
        groups[key] = {
          id: part.id,
          name: part.name,
          totalWeight: part.weight,
          totalSold: part.sold || 0,
          sellPrice: part.sellPrice || 0,
          price: part.price || 0,
          postId: part.postId,
          isActive: part.isActive,
        };
      } else {
        groups[key].totalWeight += part.weight;
        groups[key].totalSold += part.sold || 0;
        if (part.sellPrice > groups[key].sellPrice)
          groups[key].sellPrice = part.sellPrice;
      }
    }

    return Object.values(groups).filter((g) => g.totalWeight - g.totalSold > 0);
  }, [parts, userId]);

  // 🔹 Combobox de nomes únicos
  const uniqueNames = useMemo(() => {
    return groupedParts.map((g) => ({ id: g.id, name: g.name }));
  }, [groupedParts]);

  // 🔹 Filtro por seleção
  const filteredParts = useMemo(() => {
    if (!selectedPart) return groupedParts;
    return groupedParts.filter((p) => p.name === selectedPart);
  }, [selectedPart, groupedParts]);

  // 🔹 Ajuste de preço (%)
  const handlePercentageChange = (id: string, value: string) => {
    setPercentages((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirmPriceUpdate = async (part: any) => {
    const parsed = parseFloat(percentages[part.id]);
    if (isNaN(parsed)) {
      toast.error("Digite uma porcentagem válida!");
      return;
    }

    const newSellPrice = part.price + (part.price * parsed) / 100;

    try {
      const res = await fetch(`/api/parts/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellPrice: newSellPrice }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar preço");
      toast.success(
        `${part.name}: preço atualizado para ${formatCurrency(newSellPrice)}`
      );
      handleUpdateSellPrice?.(part.id, newSellPrice);
      setOpenDialog({ id: null, type: null });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar preço de venda");
    }
  };

  // 🔹 Redução de parte
  const handleReductionChange = (
    id: string,
    field: "name" | "weight" | "percent",
    value: string
  ) => {
    setReductionValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleConfirmReduction = async (part: any) => {
    const reduction = reductionValues[part.id];
    if (!reduction?.name || !reduction?.weight) {
      toast.error("Preencha o nome e o peso da nova parte.");
      return;
    }

    const weightToReduce = parseFloat(reduction.weight);
    const percent = parseFloat(reduction.percent || "0");

    if (isNaN(weightToReduce) || weightToReduce <= 0) {
      toast.error("Digite um peso válido para redução.");
      return;
    }

    const available = part.totalWeight - part.totalSold;
    if (weightToReduce >= available) {
      toast.error("Peso de redução maior ou igual ao disponível!");
      return;
    }

    try {
      const adjustedSellPrice =
        part.sellPrice && !isNaN(percent)
          ? part.sellPrice + (part.sellPrice * percent) / 100
          : part.sellPrice;

      const newPartPayload = {
        postId: part.postId,
        name: reduction.name,
        weight: weightToReduce,
        price: part.price,
        sellPrice: adjustedSellPrice,
        isActive: part.isActive ?? true,
        sold: 0,
      };

      const createRes = await fetch(`/api/parts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPartPayload),
      });

      if (!createRes.ok) {
        const text = await createRes.text();
        toast.error(`Erro ao criar nova parte: ${text}`);
        return;
      }

      const updatedWeight = part.totalWeight - weightToReduce;
      const patchRes = await fetch(`/api/parts/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: updatedWeight }),
      });

      if (!patchRes.ok) {
        const text = await patchRes.text().catch(() => "");
        toast.error(
          `Erro ao atualizar parte original: ${patchRes.status} ${text}`
        );
        return;
      }

      toast.success(
        `Parte "${part.name}" reduzida. Nova parte "${
          reduction.name
        }" criada (${weightToReduce}kg, ${percent || 0}% sobre preço de venda).`
      );

      setReductionValues((prev) => ({
        ...prev,
        [part.id]: { name: "", weight: "", percent: "" },
      }));
      setOpenDialog({ id: null, type: null });
    } catch (err) {
      console.error("Erro no handleConfirmReduction:", err);
      toast.error(
        "Erro inesperado ao reduzir parte. Veja console para detalhes."
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 px-0">
      <div className="flex items-center gap-6">
        {/* 🔹 Combobox de seleção */}
        <Popover open={openCombo} onOpenChange={setOpenCombo}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
            >
              {selectedPart || "Selecione um produto"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Buscar parte..." />
              <CommandEmpty>Nenhuma parte encontrada.</CommandEmpty>
              <CommandGroup>
                {uniqueNames.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => {
                      setSelectedPart(item.name);
                      setOpenCombo(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedPart === item.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedPart && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPart("")}
            className="flex items-center gap-1 text-sm"
          >
            <X className="w-4 h-4" /> Limpar
          </Button>
        )}
      </div>

      {/* 🔹 Tabela */}
      <div className="max-h-[200px] h-[200px] overflow-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <tbody>
            <tr className="bg-gray-200 sticky top-0">
              <th>Item</th>
              <th>Quant.</th>
              <th>Preço</th>
              <th>Ações</th>
            </tr>

            {filteredParts.map((part) => (
              <tr key={part.id}>
                <td className="p-2 border-r">{part.name}</td>
                <td className="p-2 border-r">
                  {(part.totalWeight - part.totalSold).toFixed(2)}kg
                </td>
                <td className="p-2 border-r">
                  {formatCurrency(part.sellPrice)}
                </td>
                <td className="p-2 flex gap-2 items-start">
                  {/* Excluir */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <Trash />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deseja deletar esse item?</DialogTitle>
                        <DialogDescription>
                          Essa mudança será irreversível.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          onClick={() => handleDeletePart(part.id, part.name)}
                        >
                          Deletar
                        </Button>
                        <DialogClose asChild>
                          <Button variant="ghost">Cancelar</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleOpenEditSheet(part)}
                  >
                    <DollarSign />
                  </Button>

                  {/* Menu principal */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <Edit />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-48 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          setOpenDialog({ id: part.id, type: "adjust" })
                        }
                      >
                        Ajustar preço
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          setOpenDialog({ id: part.id, type: "reduce" })
                        }
                      >
                        Reduzir
                      </Button>
                    </PopoverContent>
                  </Popover>

                  {/* Dialogs */}
                  {openDialog.id === part.id &&
                    openDialog.type === "adjust" && (
                      <Dialog
                        open
                        onOpenChange={() =>
                          setOpenDialog({ id: null, type: null })
                        }
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajustar preço (%)</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Input
                              type="number"
                              value={percentages[part.id] || ""}
                              placeholder="Ex: 10 para +10%"
                              onChange={(e) =>
                                handlePercentageChange(part.id, e.target.value)
                              }
                            />
                            <p className="text-xs text-gray-500">
                              Base: {formatCurrency(part.price)}
                              <br />
                              Novo:{" "}
                              <span className="font-semibold">
                                {formatCurrency(
                                  part.price +
                                    (part.price *
                                      (parseFloat(percentages[part.id]) || 0)) /
                                      100
                                )}
                              </span>
                            </p>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => handleConfirmPriceUpdate(part)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setOpenDialog({ id: null, type: null })
                              }
                            >
                              Voltar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                  {openDialog.id === part.id &&
                    openDialog.type === "reduce" && (
                      <Dialog
                        open
                        onOpenChange={() =>
                          setOpenDialog({ id: null, type: null })
                        }
                      >
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Nova parte (redução)</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Input
                              placeholder="Nome da nova parte"
                              value={reductionValues[part.id]?.name || ""}
                              onChange={(e) =>
                                handleReductionChange(
                                  part.id,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Peso a reduzir (kg)"
                              value={reductionValues[part.id]?.weight || ""}
                              onChange={(e) =>
                                handleReductionChange(
                                  part.id,
                                  "weight",
                                  e.target.value
                                )
                              }
                            />
                            <Input
                              type="number"
                              placeholder="% sobre preço de venda (ex: 10 para +10%)"
                              value={reductionValues[part.id]?.percent || ""}
                              onChange={(e) =>
                                handleReductionChange(
                                  part.id,
                                  "percent",
                                  e.target.value
                                )
                              }
                            />
                            <p className="text-xs text-gray-500">
                              Peso disponível:{" "}
                              {(part.totalWeight - part.totalSold).toFixed(2)}kg
                              <br />
                              Preço atual: {formatCurrency(part.sellPrice)}
                              <br />
                              Novo preço:{" "}
                              <span className="font-semibold">
                                {formatCurrency(
                                  part.sellPrice +
                                    (part.sellPrice *
                                      parseFloat(
                                        reductionValues[part.id]?.percent || "0"
                                      )) /
                                      100
                                )}
                              </span>
                            </p>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => handleConfirmReduction(part)}
                            >
                              Confirmar Redução
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setOpenDialog({ id: null, type: null })
                              }
                            >
                              Voltar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
