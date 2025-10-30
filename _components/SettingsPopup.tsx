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
    { name: "age", label: "Idade", type: "number", placeholder: "Ex: 25" },
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
    { name: "isActive", label: "Disponível", type: "checkbox" },
    {
      name: "weight",
      label: "Peso (kg)",
      type: "number",
      placeholder: "Ex: 1.5",
    },
  ],
  patterns: [
    { name: "name", label: "Nome do Padrão", placeholder: "Ex: Corte Bovino" },
    {
      name: "description",
      label: "Descrição",
      placeholder: "Ex: Divisão do boi em cortes principais",
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

interface PartPayload {
  name: string;
  percentage?: number;
  weight: number;
  price?: number;
  sellPrice?: number;
  isActive?: boolean;
}

export default function SettingsPopup({
  type,
  onClose,
  onSubmit,
  userId,
  initialData = {},
  mode = "create",
}: SettingsPopupProps) {
  const [formData, setFormData] = useState<any>(initialData);
  const [categories, setCategories] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<any | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [parts, setParts] = useState<PartPayload[]>([]);

  const fields = FIELD_SCHEMAS[type] || [];

  // 🔹 Buscar categorias e padrões
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoadingCategories(true);
      try {
        const catRes = await fetch(`/api/categories/${userId}`);
        const cats = catRes.ok ? await catRes.json() : [];
        setCategories(cats);

        if (type === "posts") {
          const patRes = await fetch(`/api/patterns/${userId}`);
          const pats = patRes.ok ? await patRes.json() : [];
          setPatterns(pats);

          if (initialData.patternId) {
            const pattern = pats.find(
              (p: any) => p.id === initialData.patternId
            );
            if (pattern) {
              setSelectedPattern(pattern);
              setFormData((prev: any) => ({
                ...prev,
                title: prev.title || pattern.name,
              }));

              if (initialData.weight) {
                const numericWeight = parseFloat(initialData.weight);
                const generatedParts = pattern.parts.map((p: any) => ({
                  name: p.name,
                  percentage: p.percentage,
                  weight: parseFloat(
                    ((numericWeight * p.percentage) / 100).toFixed(2)
                  ),
                }));
                setParts(generatedParts);
              } else {
                const generatedParts = pattern.parts.map((p: any) => ({
                  name: p.name,
                  percentage: p.percentage,
                }));
                setParts(generatedParts);
              }
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar categorias/padrões:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [type, userId, initialData]);

  // 🔹 Funções de manipulação de partes
  const handleAddPart = () => {
    setParts([
      ...parts,
      {
        name: "",
        percentage: 0,
        weight: 0,
        price: 0,
        sellPrice: 0,
        isActive: true,
      },
    ]);
  };

  const handlePartChange = (
    index: number,
    field: keyof PartPayload,
    value: string | number | boolean
  ) => {
    setParts((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]: ["percentage", "weight", "price", "sellPrice"].includes(
                field
              )
                ? parseFloat(value as string)
                : value,
            }
          : p
      )
    );
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  // 🔹 Manipular inputs comuns
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev: any) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "weight" && selectedPattern) {
        const numericWeight = parseFloat(value) || 0;
        const updatedParts = selectedPattern.parts.map((p: any) => ({
          name: p.name,
          percentage: p.percentage,
          weight: parseFloat(((numericWeight * p.percentage) / 100).toFixed(2)),
          price: parseFloat(formData.price) || 0,
          sellPrice: parseFloat(formData.sellPrice) || 0,
          isActive: true,
        }));
        setParts(updatedParts);
      }

      return newData;
    });
  };

  const handlePatternSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patternId = e.target.value;
    if (!patternId) {
      setSelectedPattern(null);
      setParts([]);
      setFormData((prev: any) => ({
        ...prev,
        patternId: undefined,
        title: "",
        categoryId: "", 
        parts: [],
      }));
      return;
    }

    const pattern = patterns.find((p) => p.id === patternId);
    if (!pattern) return;

    setSelectedPattern(pattern);

    // Atualiza o form com o patternId, title e categoryId do pattern
    setFormData((prev: any) => ({
      ...prev,
      patternId,
      title: pattern.name,
      categoryId: pattern.categoryId, // herdando categoria do pattern
    }));

    const numericWeight = parseFloat(formData.weight) || 0;
    // Cria partes do post baseado nas partes do pattern
    const generatedParts = pattern.parts.map((p: any) => ({
      name: p.name,
      percentage: p.percentage,
      weight: parseFloat(((numericWeight * p.percentage) / 100).toFixed(2)),
      price: parseFloat(formData.price) || 0,
      sellPrice: parseFloat(formData.sellPrice) || 0,
      isActive: true,
    }));

    setParts(generatedParts);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      userId,
      parts:
        type === "patterns"
          ? parts.map((p) => ({
              name: p.name,
              percentage: p.percentage ?? 0,
            }))
          : parts.map((p) => ({
              name: p.name,
              weight: parseFloat(
                ((formData.weight * (p.percentage ?? 0)) / 100).toFixed(2)
              ),
              price: p.price ?? 0,
              sellPrice: p.sellPrice ?? 0,
              isActive: p.isActive ?? true,
            })),
    };
    console.log("📦 Payload enviado:", JSON.stringify(payload, null, 2));


    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="capitalize">
            {mode === "edit" ? "Editar" : "Adicionar"}{" "}
            {type === "" ? "item" : type.slice(0, -1)}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Campos dinâmicos */}
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium mb-1">{field.label}</label>
              <Input
                name={field.name}
                type={field.type || "text"}
                placeholder={field.placeholder}
                value={formData[field.name] || ""}
                onChange={handleChange}
                disabled={field.name === "title" && selectedPattern}
              />
            </div>
          ))}

          {/* Select de categoria e padrão (posts) */}
          {type === "posts" && (
            <>
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

              {patterns.length > 0 && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Padrão</label>
                  <NativeSelect
                    name="patternId"
                    value={formData.patternId || ""}
                    onChange={handlePatternSelect}
                  >
                    <option value="">Selecione um padrão</option>
                    {patterns.map((pattern) => (
                      <option key={pattern.id} value={pattern.id}>
                        {pattern.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}

              {parts.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Partes Geradas:</h4>
                  <ul className="space-y-1 text-sm">
                    {parts.map((p, i) => (
                      <li key={i}>
                        {p.name}: {p.percentage}%{" "}
                        {p.weight !== undefined && `→ ${p.weight}kg`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Botão de salvar */}
          <Button className="w-full mt-4" onClick={handleSubmit}>
            {mode === "edit" ? "Salvar alterações" : "Salvar"}
          </Button>

          {/* Editor de partes (patterns) */}
          {type === "patterns" && (
            <div className="space-y-2 border-t pt-3">
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
              <h4 className="text-sm font-medium">Partes do Padrão (%)</h4>
              {parts.map((part, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nome da parte"
                    value={part.name}
                    onChange={(e) =>
                      handlePartChange(index, "name", e.target.value)
                    }
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={part.percentage}
                    onChange={(e) =>
                      handlePartChange(index, "percentage", e.target.value)
                    }
                  />

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemovePart(index)}
                  >
                    ✕
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPart}
              >
                + Adicionar Parte
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
