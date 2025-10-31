"use client";
import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/_components/ui/sheet";
import { Button } from "@/_components/ui/button";
import { NativeSelect } from "@/_components/ui/native-select";
import { formatCurrency } from "@/helpers/format-currency";

interface SalesSummarySheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  salesPeriod: string;
  setSalesPeriod: (v: any) => void;
  salesData: any[];
  calculateSalesData: () => void;
}

export default function SalesSummarySheet({ open, setOpen, salesPeriod, setSalesPeriod, salesData, calculateSalesData }: SalesSummarySheetProps) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="px-6">
        <SheetHeader>
          <SheetTitle>Vendas e Margem de Lucro</SheetTitle>
          <SheetDescription>Filtre o período para analisar suas vendas.</SheetDescription>
        </SheetHeader>

        <div className="mb-4 flex items-center">
          <NativeSelect value={salesPeriod} onChange={(e) => setSalesPeriod(e.target.value as any)}>
            <option value="hour">Última hora</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="year">Este ano</option>
            <option value="ever">Todo período</option>
          </NativeSelect>
          <Button variant="outline" className="ml-2" onClick={calculateSalesData}>Filtrar</Button>
        </div>

        <table className="w-full border border-gray-300 text-sm rounded-md">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border-r">Post</th>
              <th className="p-2 border-r">Total vendas</th>
              <th className="p-2 border-r">Lucro</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((s, i) => (
              <tr key={i}>
                <td className="p-2 border-r">{s.postTitle}</td>
                <td className="p-2 border-r">{formatCurrency(s.totalSales)}</td>
                <td className="p-2 border-r">{formatCurrency(s.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <SheetFooter className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
