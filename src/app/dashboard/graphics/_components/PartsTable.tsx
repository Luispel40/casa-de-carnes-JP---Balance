"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Trash, Edit, DollarSign } from "lucide-react";
import PostItem from "../../_components/post";
import { formatCurrency } from "@/helpers/format-currency";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/_components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/_components/ui/popover";

interface PartsTableProps {
  posts: any[];
  parts: any[];
  selectedPost: string;
  setSelectedPost: (id: string) => void;
  openEditSheet: (part: any) => void;
  handleDeletePart: (id: string, name: string) => void;
  handleUpdateSellPrice?: (id: string, newSellPrice: number) => void;
}

export default function PartsTable({
  posts,
  parts,
  selectedPost,
  setSelectedPost,
  openEditSheet,
  handleDeletePart,
  handleUpdateSellPrice,
}: PartsTableProps) {
  const [percentages, setPercentages] = useState<{ [key: string]: string }>({});
  const [reductionValues, setReductionValues] = useState<{
    [key: string]: { name: string; weight: string; percent?: string };
  }>({});
  const [openDialog, setOpenDialog] = useState<{
    id: string | null;
    type: "adjust" | "reduce" | null;
  }>({ id: null, type: null });

  const filteredParts = useMemo(() => {
    if (!Array.isArray(parts)) return [];
    if (!selectedPost) return parts;
    return parts.filter((part) => part.postId === selectedPost);
  }, [parts, selectedPost]);

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
      toast.success(`${part.name}: preço atualizado para ${formatCurrency(newSellPrice)}`);
      handleUpdateSellPrice?.(part.id, newSellPrice);
      setOpenDialog({ id: null, type: null });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar preço de venda");
    }
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

    const available = part.weight - (part.sold || 0);
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

      const updatedWeight = part.weight - weightToReduce;
      const patchRes = await fetch(`/api/parts/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: updatedWeight }),
      });

      if (!patchRes.ok) {
        const text = await patchRes.text().catch(() => "");
        toast.error(`Erro ao atualizar parte original: ${patchRes.status} ${text}`);
        return;
      }

      toast.success(
        `Parte "${part.name}" reduzida. Nova parte "${reduction.name}" criada (${weightToReduce}kg, ${percent || 0}% sobre preço de venda).`
      );

      setReductionValues((prev) => ({
        ...prev,
        [part.id]: { name: "", weight: "", percent: "" },
      }));
      setOpenDialog({ id: null, type: null });
    } catch (err) {
      console.error("Erro no handleConfirmReduction:", err);
      toast.error("Erro inesperado ao reduzir parte. Veja console para detalhes.");
    }
  };

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

  return (
    <PostItem
      data={posts.map((post) => ({ id: post.id, title: post.title }))}
      onSelectCategory={setSelectedPost}
    >
      <div className="max-h-[200px] h-[200px] overflow-auto">
        <table className="lg:min-w-lg min-w-full w-[300px] border border-gray-300 p-6 text-sm">
          <tbody className="w-full">
            <tr className="bg-gray-200 sticky top-0">
              <th>item</th>
              <th>quant..</th>
              <th>Preço</th>
              <th>Ações</th>
            </tr>

            {filteredParts.map((part: any) => (
              <tr key={part.id} className={part.sold === part.weight ? "hidden" : ""}>
                <td className="p-2 border-r">{part.name}</td>
                <td className="p-2 border-r">
                  {part.weight - (part.sold || 0)}kg
                </td>
                <td className="p-2 border-r">{formatCurrency(part.sellPrice)}</td>

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
                        <Button onClick={() => handleDeletePart(part.id, part.name)}>
                          Deletar
                        </Button>
                        <DialogClose asChild>
                          <Button variant="ghost">Cancelar</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Editar preço */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditSheet(part)}
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
                        onClick={() => setOpenDialog({ id: part.id, type: "adjust" })}
                      >
                        Ajustar preço
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setOpenDialog({ id: part.id, type: "reduce" })}
                      >
                        Reduzir
                      </Button>
                    </PopoverContent>
                  </Popover>

                  {/* Dialog Ajustar */}
                  {openDialog.id === part.id && openDialog.type === "adjust" && (
                    <Dialog open onOpenChange={() => setOpenDialog({ id: null, type: null })}>
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
                          <Button onClick={() => handleConfirmPriceUpdate(part)}>
                            Confirmar
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setOpenDialog({ id: null, type: null })}
                          >
                            Voltar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Dialog Reduzir */}
                  {openDialog.id === part.id && openDialog.type === "reduce" && (
                    <Dialog open onOpenChange={() => setOpenDialog({ id: null, type: null })}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Nova parte (redução)</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Input
                            placeholder="Nome da nova parte"
                            value={reductionValues[part.id]?.name || ""}
                            onChange={(e) =>
                              handleReductionChange(part.id, "name", e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            placeholder="Peso a reduzir (kg)"
                            value={reductionValues[part.id]?.weight || ""}
                            onChange={(e) =>
                              handleReductionChange(part.id, "weight", e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            placeholder="% sobre preço de venda (ex: 10 para +10%)"
                            value={reductionValues[part.id]?.percent || ""}
                            onChange={(e) =>
                              handleReductionChange(part.id, "percent", e.target.value)
                            }
                          />

                          <p className="text-xs text-gray-500">
                            Peso disponível: {part.weight - (part.sold || 0)}kg
                            <br />
                            Preço atual: {formatCurrency(part.sellPrice)}
                            <br />
                            Novo preço:{" "}
                            <span className="font-semibold">
                              {formatCurrency(
                                part.sellPrice +
                                  (part.sellPrice *
                                    (parseFloat(
                                      reductionValues[part.id]?.percent || "0"
                                    ))) /
                                    100
                              )}
                            </span>
                          </p>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleConfirmReduction(part)}>
                            Confirmar Redução
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setOpenDialog({ id: null, type: null })}
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
    </PostItem>
  );
}
