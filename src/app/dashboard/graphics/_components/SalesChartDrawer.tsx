"use client";
import React from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/_components/ui/drawer";
import { Button } from "@/_components/ui/button";
import { NativeSelect } from "@/_components/ui/native-select";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface SalesChartDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  chartData: any[];
  salesPeriod: string;
  setSalesPeriod: (v: any) => void;
  fetchSalesChart: () => void;
}

export default function SalesChartDrawer({ open, setOpen, chartData, salesPeriod, setSalesPeriod, fetchSalesChart }: SalesChartDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="p-6">
        <DrawerHeader>
          <DrawerTitle>📈 Margem de Lucro por Parte</DrawerTitle>
          <DrawerDescription>
            Vendas agrupadas por nome da parte conforme o período selecionado.
          </DrawerDescription>
        </DrawerHeader>

        <div className="mb-4">
          <NativeSelect value={salesPeriod} onChange={(e) => setSalesPeriod(e.target.value as any)}>
            <option value="hour">Última hora</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="year">Este ano</option>
            <option value="ever">Todo período</option>
          </NativeSelect>
          <Button className="mt-2 w-full" onClick={fetchSalesChart}>Atualizar Gráfico</Button>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="partName" />
                <YAxis />
                <Tooltip formatter={(value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)} />
                <Bar dataKey="totalSales" name="Total de Vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Lucro" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-4">Nenhuma venda encontrada para este período.</p>
        )}

        <DrawerFooter className="mt-4">
          <DrawerClose asChild>
            <Button variant="outline">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
