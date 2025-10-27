"use client";

import { useEffect, useState } from "react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { NativeSelect } from "@/_components/ui/native-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";

// 🔹 Schema de campos por tipo
const FIELD_SCHEMAS: Record<
  string,
  { name: string; label: string; type?: string; placeholder?: string }[]
> = {
  categories: [
    { name: "name", label: "Nome da Categoria", placeholder: "Ex: Bovina" },
    
  ],
  employees: [
    {
      name: "name",
      label: "Nome do Funcionário",
      placeholder: "Ex: João Silva",
    },
    { name: "role", label: "Cargo", placeholder: "Ex: Açougueiro" },
    {
      name: "salary",
      label: "Salário",
      type: "number",
      placeholder: "Ex: 2500.00",
    },
    {
      name: "age",
      label: "Idade",
      type: "number",
      placeholder: "Ex: 25",
    },
  ],
  posts: [
    {
      name: "title",
      label: "Título do Produto",
      placeholder: "Ex: Picanha Premium",
    },
    { name: "price", label: "Preço", type: "number", placeholder: "Ex: 59.90" },
    {
      name: "sellPrice",
      label: "Preço de Venda",
      type: "number",
      placeholder: "Ex: 79.90",
    },
    { name: "isActive", label: "Disponivel", type: "checkbox" },
    {
      name: "weight",
      label: "Peso (kg)",
      type: "number",
      placeholder: "Ex: 1.5",
    },
  ],
};

interface SettingsPopupProps {
  type: string;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  userId: string;
  initialData?: any;
  mode?: "create" | "edit";
}

export default function SettingsPopup({
  type,
  onClose,
  onSubmit,
  userId,
  initialData,
  mode = "create",
}: SettingsPopupProps) {
  const [formData, setFormData] = useState<any>({initialData});
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const fields = FIELD_SCHEMAS[type] || [];

  // 🔹 Busca as categorias do banco quando o tipo for "posts"
  useEffect(() => {
    if (type !== "posts" || !userId) return;

    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch(`/api/categories/${userId}`); // 👈 inclui o userId
        if (!res.ok) throw new Error("Erro ao buscar categorias");
        const json = await res.json();
        setCategories(json);
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [type, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value, type, checked } = e.target as HTMLInputElement;
  setFormData((prev: any) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,
  }));
};

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="capitalize">
            {mode === "edit" ? "Editar" : "Adicionar"} {type === "" ? "item" : type.slice(0, -1)}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {fields.length === 0 && type !== "posts" ? (
            <p className="text-gray-500 text-sm">
              Selecione um tipo válido para adicionar.
            </p>
          ) : (
            <>
              {fields.map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label className="text-sm font-medium mb-1">
                    {field.label}
                  </label>
                  <Input
                    name={field.name}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                  />
                </div>
              ))}

              {/* 🔹 Select de categoria dinâmico */}
              {type === "posts" && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Categoria</label>
                  <NativeSelect
                    name="categoryId"
                    value={formData.categoryId || ""}
                    onChange={handleChange}
                  >
                    <option value="">
                      {loadingCategories
                        ? "Carregando..."
                        : "Selecione uma categoria"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </>
          )}

          {fields.length > 0 && (
            <Button className="w-full mt-4" onClick={handleSubmit}>
              {mode === "edit" ? "Salvar alterações" : "Salvar"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
