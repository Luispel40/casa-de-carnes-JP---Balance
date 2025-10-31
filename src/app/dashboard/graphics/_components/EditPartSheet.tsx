"use client";
import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/_components/ui/sheet";
import { Button } from "@/_components/ui/button";
import { Label } from "@/_components/ui/label";
import { Input } from "@/_components/ui/input";
import { DollarSign } from "lucide-react";

interface EditPartSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedPart: any;
  soldValue: number;
  setSoldValue: (v: number) => void;
  sellPrice: number;
  setSellPrice: (v: number) => void;
  fillAllRemaining: () => void;
  handleBaixa: () => void;
}

export default function EditPartSheet({
  open,
  setOpen,
  selectedPart,
  soldValue,
  setSoldValue,
  sellPrice,
  setSellPrice,
  fillAllRemaining,
  handleBaixa,
}: EditPartSheetProps) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="px-6">
        <SheetHeader>
          <SheetTitle>{selectedPart?.name || "Editar Parte"}</SheetTitle>
          {selectedPart && (
            <SheetDescription>
              Atualmente temos{" "}
              <strong>{selectedPart.weight - (selectedPart.sold || 0)}kg</strong> de <strong>{selectedPart.name}</strong> no estoque.
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="sold">Quantidade vendida (kg)</Label>
              <Input
                id="sold"
                type="number"
                value={soldValue}
                onChange={(e) => setSoldValue(Number(e.target.value))}
                max={selectedPart?.weight - (selectedPart?.sold || 0)}
              />
            </div>
            <Button variant="outline" size="sm" className="mb-1" onClick={fillAllRemaining}>Tudo</Button>
          </div>

          <div>
            <Label htmlFor="sellPrice">Preço de venda (R$)</Label>
            <Input id="sellPrice" type="number" value={sellPrice} onChange={(e) => setSellPrice(Number(e.target.value))} />
          </div>
        </div>

        <SheetFooter className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleBaixa} variant="default">
            Confirmar <DollarSign className="w-4 h-4 ml-2" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
