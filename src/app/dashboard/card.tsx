"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardAction,
} from "@/_components/ui/card";
import { Button } from "@/_components/ui/button";
import { ArrowRight } from "lucide-react";
import { NativeSelect } from "@/_components/ui/native-select";
import SettingsPopup from "_components/SettingsPopup";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { ScrollArea } from "@/_components/ui/scroll-area";

interface CardItemProps {
  userId: string;
  selected: string;
}

export default function CardItem({ userId, selected }: CardItemProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [selectedType, setSelectedType] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const routes: Record<string, string> = {
    posts: "/dashboard/graphics",
    employees: "/dashboard/equip",
    profile: "/dashboard/profile",
    settings: "/dashboard/settings",
  };

  // 🔹 Carrega dados conforme a aba selecionada
  useEffect(() => {
    if (!selected || !userId) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        let endpoint = "";

        switch (selected) {
          case "profile":
            endpoint = `/api/user/${userId}`;
            break;
          case "posts":
            endpoint = `/api/posts/${userId}`;
            break;
          case "employees":
            endpoint = `/api/employees/${userId}`;
            break;
          case "settings":
            endpoint = `/api/user/${userId}`;
            break;
          default:
            return;
        }

        const res = await fetch(endpoint);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selected, userId]);

  // 🔹 Agrupamento de posts por categoria
  const groupedPosts = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const map = new Map<
      string,
      { category: string; totalWeight: number; sold: number; available: number }
    >();

    for (const post of data) {
      const category = post.category?.name || "Sem categoria";
      const weight = Number(post.weight) || 0;
      const sold = Number(post.sold) || 0;

      if (!map.has(category)) {
        map.set(category, {
          category,
          totalWeight: weight,
          sold,
          available: weight - sold,
        });
      } else {
        const existing = map.get(category)!;
        existing.totalWeight += weight;
        existing.sold += sold;
        existing.available += weight - sold;
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.category.localeCompare(b.category)
    );
  }, [data]);

  const totalAvailable = useMemo(
    () => groupedPosts.reduce((acc, g) => acc + g.available, 0),
    [groupedPosts]
  );

  // 🔹 Adição de novos itens (configurações)
  const handleAdd = () => {
    if (!selectedType)
      return toast.error("Selecione um tipo antes de adicionar.");
    setIsPopupOpen(true);
  };

  const renderContent = () => {
    if (loading) return <p>Carregando...</p>;
    if (!data) return <p>Selecione uma categoria</p>;

    switch (selected) {
      case "profile":
        return (
          <div className="space-y-2" key={data.id}>
            <div className="flex w-full flex-row items-center justify-start gap-4">
              {data.image && (
                <Image
                  src={data.image}
                  alt={data.name}
                  width={50}
                  height={50}
                  className="-mt-16 rounded-full"
                />
              )}
              <p className="text-xl font-semibold md:text-3xl text-left -mt-14">
                {data.name}
              </p>
            </div>
            <div className="space-y-2 max-h-[150px] overflow-auto">
              <p>
                <strong>Email:</strong> {data.email}
              </p>
              <p>
                <strong>Telefone:</strong> {data.phone}
              </p>
              <p>
                <strong>Endereço:</strong> {data.address}
              </p>
              <p>
                <strong>Empresa:</strong> {data.enteprise}
              </p>
            </div>
          </div>
        );

      case "posts":
        if (!Array.isArray(data)) return <p>Nenhum post encontrado.</p>;

        return (
          <div className="flex flex-col gap-3">
            {/* <p className="text-sm text-muted-foreground">
              Peso total disponível:{" "}
              <span className="font-semibold">{totalAvailable.toFixed(2)} kg</span>
            </p> */}

            {/* <ScrollArea className="h-[200px] border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left p-2 font-medium">Categoria</th>
                    <th className="text-right p-2 font-medium">Peso Total</th>
                    <th className="text-right p-2 font-medium">Vendido</th>
                    <th className="text-right p-2 font-medium">Disponível</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedPosts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-muted-foreground py-4"
                      >
                        Nenhum post encontrado
                      </td>
                    </tr>
                  ) : (
                    groupedPosts.map((g) => (
                      <tr
                        key={g.category}
                        className="border-t border-muted hover:bg-accent/30 transition-colors"
                      >
                        <td className="p-2">{g.category}</td>
                        <td className="p-2 text-right">{g.totalWeight.toFixed(2)} kg</td>
                        <td className="p-2 text-right">{g.sold.toFixed(2)} kg</td>
                        <td className="p-2 text-right font-semibold">
                          {g.available.toFixed(2)} kg
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea> */}
            <p>Entre para ver mais detalhes</p>
          </div>
        );

      case "employees":
        if (!Array.isArray(data)) return <p>Nenhum funcionário encontrado.</p>;
        return (
          <ul className="list-disc list-inside space-y-1">
            {data.map((emp: any) => (
              <li key={emp.id}>
                {emp.name} ({emp.role})
              </li>
            ))}
          </ul>
        );

      case "settings":
        return (
          <div className="space-y-3">
            <NativeSelect
              onChange={(e) => setSelectedType(e.target.value)}
              value={selectedType}
            >
              <option value="">Selecione</option>
              <option value="categories">Categoria</option>
              <option value="employees">Funcionário</option>
              <option value="posts">Item</option>
              <option value="patterns">Padrão</option>
            </NativeSelect>

            <Button onClick={handleAdd} className="w-full">
              Adicionar
            </Button>

            {isPopupOpen && selectedType && (
              <SettingsPopup
                type={selectedType}
                onClose={() => setIsPopupOpen(false)}
                onSubmit={async (formData) => {
                  try {
                    const body = { ...formData, userId };
                    const endpoint = `/api/${selectedType}`;

                    const res = await fetch(endpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });

                    if (!res.ok) {
                      const text = await res.text();
                      toast.error(`Erro ao criar ${selectedType}: ${text}`);
                      return;
                    }

                    const json = await res.json();
                    toast.success(`Criado ${selectedType} com sucesso!`);
                    setData((prev: any) =>
                      Array.isArray(prev) ? [...prev, json] : [json]
                    );
                  } catch (err) {
                    toast.error(`Falha ao criar ${selectedType}: ${err}`);
                  }
                }}
                userId={userId}
              />
            )}
          </div>
        );

      default:
        return <p>Selecione uma opção</p>;
    }
  };

  return (
    <Card className="w-96 min-h-[300px] max-h-[300px]">
      <CardHeader>
        <CardTitle>{selectedCategory || "Resumo"}</CardTitle>
        <CardAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(routes[selected] || "/dashboard")}
          >
            <ArrowRight />
            <Link href="/equip"></Link>
          </Button>
        </CardAction>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
