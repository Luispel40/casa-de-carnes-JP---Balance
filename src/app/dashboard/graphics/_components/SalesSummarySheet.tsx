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
      <th className="p-2 border-r text-left">item</th>
      <th className="p-2 border-r text-left">de</th>
      <th className="p-2 border-r text-right">Total vendas</th>
      <th className="p-2 text-right">Lucro</th>
    </tr>
  </thead>

  <tbody>
    {salesData.length === 0 ? (
      <tr>
        <td colSpan={4} className="p-4 text-center text-gray-500">
          Nenhum resultado encontrado para este período.
        </td>
      </tr>
    ) : (
      salesData.map((s, i) => (
        <tr key={i} className="hover:bg-gray-100 transition">
          <td className="p-2 border-r">{s.partName}</td>
          <td className="p-2 border-r text-gray-600">{s.postTitle}</td>
          <td className="p-2 border-r text-right font-medium">
            {formatCurrency(s.totalSales)}
          </td>
          <td
            className={`p-2 text-right font-semibold ${
              s.profit >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {formatCurrency(s.profit)}
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>


        <SheetFooter className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
