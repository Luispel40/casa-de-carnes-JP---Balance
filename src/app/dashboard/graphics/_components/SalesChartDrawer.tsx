"use client";
import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/_components/ui/drawer";
import { Button } from "@/_components/ui/button";
import { NativeSelect } from "@/_components/ui/native-select";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SalesChartDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  chartData: any[];
  salesPeriod: string;
  setSalesPeriod: (v: any) => void;
  fetchSalesChart: () => void;
}

export default function SalesChartDrawer({
  open,
  setOpen,
  chartData,
  salesPeriod,
  setSalesPeriod,
  fetchSalesChart,
}: SalesChartDrawerProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      return (
        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200">
          <p className="font-semibold">{item.partName}</p>
          <p className="text-sm text-gray-600">
            Total:{" "}
            <span className="font-medium">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(item.totalSales)}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Lucro:{" "}
            <span className="font-medium text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(item.profit)}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">{item.createdAt}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="p-6">
        <DrawerHeader>
          <DrawerTitle>📈 Estatísticas de Vendas</DrawerTitle>
          <DrawerDescription>
            Cada barra representa uma venda individual.
          </DrawerDescription>
        </DrawerHeader>

        <div className="mb-4">
          <NativeSelect
            value={salesPeriod}
            onChange={(e) => setSalesPeriod(e.target.value as any)}
          >
            <option value="hour">Última hora</option>
            <option value="today">Hoje</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="year">Este ano</option>
            <option value="ever">Todo período</option>
          </NativeSelect>
          <Button className="mt-2 w-full" onClick={fetchSalesChart}>
            Atualizar Gráfico
          </Button>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* 🔹 Mostra a data/hora no eixo X */}
                <XAxis dataKey="createdAt" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalSales" name="Total" fill="#3b82f6" />
                <Bar dataKey="profit" name="Lucro" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-4">
            Nenhuma venda encontrada para este período.
          </p>
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
