"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Trash, Edit, DollarSign } from "lucide-react";
import PostItem from "../../_components/post";
import { formatCurrency } from "@/helpers/format-currency";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/_components/ui/popover";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { toast } from "sonner";

interface PartsTableProps {
  posts: any[];
  parts: any[];
  selectedPost: string;
  setSelectedPost: (id: string) => void;
  openEditSheet: (part: any) => void;
  handleDeletePart: (id: string) => void;
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
  const [openPopover, setOpenPopover] = useState<string | null>(null);

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
      toast.success(
        `${part.name}: preço atualizado para ${formatCurrency(newSellPrice)}`
      );

      handleUpdateSellPrice?.(part.id, newSellPrice);
      setOpenPopover(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar preço de venda");
    }
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
              <th>cat</th>
              <th>Ações</th>
            </tr>

            {filteredParts.map((part: any) => (
              <tr
                key={part.id}
                className={part.sold === part.weight ? "hidden" : ""}
              >
                <td className="p-2 border-r">{part.name}</td>
                <td className="p-2 border-r">{part.weight - part.sold}kg</td>
                <td className="p-2 border-r">
                  {formatCurrency(part.sellPrice)}
                </td>
                <td className="p-2 border-r">{part.postTitle}</td>
                <td className="p-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeletePart(part.id)}
                    disabled={part.sold === part.weight}
                  >
                    <Trash />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditSheet(part)}
                  >
                    <DollarSign />
                  </Button>

                  {/* ✏️ Novo Popover para editar preço */}
                  <Popover
                    open={openPopover === part.id}
                    onOpenChange={(open) =>
                      setOpenPopover(open ? part.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <Edit />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-56 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">
                          Ajustar preço (%)
                        </Label>
                        <Input
                          type="number"
                          value={percentages[part.id] || ""}
                          placeholder="Ex: 10 para +10%"
                          onChange={(e) =>
                            handlePercentageChange(part.id, e.target.value)
                          }
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-2">
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

                      <Button
                        className="w-full"
                        onClick={() => handleConfirmPriceUpdate(part)}
                      >
                        Confirmar
                      </Button>
                    </PopoverContent>
                  </Popover>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PostItem>
  );
}
