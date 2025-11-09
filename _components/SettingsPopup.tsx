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
import { useDataCache } from "_contexts/DataCacheContext";
import { Checkbox } from "@/_components/ui/checkbox"; // Adicionado para melhor UX para Checkbox

const FIELD_SCHEMAS: Record<
  string,
  { name: string; label: string; type?: string; placeholder?: string }[]
> = {
  categories: [
    { name: "name", label: "Nome da Categoria", placeholder: "Ex: Bovina" },
    {
      name: "special",
      label: "Categoria unitária?",
      type: "checkbox",
    },
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
    {
      name: "price",
      label: "Preço de Custo (R$)",
      type: "number",
      placeholder: "Ex: 59.90",
    },
    {
      name: "sellPrice",
      label: "Preço de Venda (R$)",
      type: "number",
      placeholder: "Ex: 79.90",
    },
    {
      name: "weight",
      label: "Peso (kg)",
      type: "number",
      placeholder: "Ex: 1.5",
    },
    { name: "isActive", label: "Disponível", type: "checkbox" },
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
  const { categories, patterns, loading, fetchCategories, fetchPatterns } =
    useDataCache();
  const [selectedPattern, setSelectedPattern] = useState<any | null>(null);
  const [parts, setParts] = useState<PartPayload[]>(
    type === "patterns" && initialData.parts
      ? initialData.parts.concat({ name: "Quebra", percentage: 0, weight: 0 })
      : [{ name: "Quebra", percentage: 100, weight: 0 }]
  );
  const [loadingCategories, setLoadingCategories] = useState(false);

  const fields = FIELD_SCHEMAS[type] || [];

  // Filtra os campos para serem renderizados no fluxo principal
  const primaryFields = fields.filter(
    (f) => !["price", "sellPrice", "weight", "isActive"].includes(f.name)
  );

  const priceFields = fields.filter((f) =>
    ["price", "sellPrice"].includes(f.name)
  );

  const weightField = fields.find((f) => f.name === "weight");
  const isActiveField = fields.find((f) => f.name === "isActive");

  // 🔹 Buscar categorias e padrões
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      setLoadingCategories(true);
      await fetchCategories(userId);
      if (type === "posts") {
        await fetchPatterns(userId);
      }

      if (type === "posts" && initialData.patternId && patterns.length > 0) {
        const pattern = patterns.find(
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
              price: initialData.price, // Manter o preço do post, se existir
              sellPrice: initialData.sellPrice, // Manter o preço de venda do post
            }));
            setParts(generatedParts);
          } else {
            const generatedParts = pattern.parts.map((p: any) => ({
              name: p.name,
              percentage: p.percentage,
              weight: p.weight ?? 0,
              price: p.price ?? 0,
              sellPrice: p.sellPrice ?? 0,
            }));
            setParts(generatedParts);
          }
        }
      } else if (type === "patterns" && initialData.parts) {
        // Recalcula quebra para o modo edit de patterns
        const initialPartsWithoutBreak = initialData.parts.filter(
          (p: any) => p.name.toLowerCase() !== "quebra"
        );
        const usedPercent = initialPartsWithoutBreak.reduce(
          (acc: number, p: any) =>
            acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
          0
        );
        setParts([
          ...initialPartsWithoutBreak,
          {
            name: "Quebra",
            percentage: Math.max(0, 100 - usedPercent),
            weight: 0,
          },
        ]);
      }
      setLoadingCategories(false);
    };

    loadData();
  }, [userId, type, initialData, patterns, fetchCategories, fetchPatterns]);

  // 🔹 Funções de manipulação de partes (Patterns)
  const handleAddPart = () => {
    const usedPercent = parts
      .filter((p) => p.name.toLowerCase() !== "quebra")
      .reduce(
        (acc, p) => acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
        0
      );

    if (usedPercent >= 100) {
      alert(
        "A soma das partes já atingiu 100%. Diminua alguma parte antes de adicionar outra."
      );
      return;
    }

    // Calcula a nova quebra antes de adicionar a nova parte
    const newBreakPercentage = Math.max(0, 100 - usedPercent);
    const partsWithoutBreak = parts.filter(
      (p) => p.name.toLowerCase() !== "quebra"
    );

    setParts([
      ...partsWithoutBreak,
      {
        name: "",
        percentage: 0,
        weight: 0,
        price: 0,
        sellPrice: 0,
        isActive: true,
      },
      { name: "Quebra", percentage: newBreakPercentage, weight: 0 },
    ]);
  };

  const handlePartChange = (
    index: number,
    field: keyof PartPayload,
    value: string | number | boolean
  ) => {
    setParts((prev) => {
      const updated = prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]: ["percentage", "weight", "price", "sellPrice"].includes(
                field
              )
                ? parseFloat(value as string) || 0 // Garante que seja número
                : value,
            }
          : p
      );

      const usedPercent = updated
        .filter((p) => p.name.toLowerCase() !== "quebra")
        .reduce(
          (acc, p) => acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
          0
        );

      const partsWithoutBreak = updated.filter(
        (p) => p.name.toLowerCase() !== "quebra"
      );

      return [
        ...partsWithoutBreak,
        {
          name: "Quebra",
          percentage: Math.max(0, 100 - usedPercent),
          weight: 0,
        },
      ];
    });
  };

  const handleRemovePart = (index: number) => {
    setParts((prev) => {
      // Remove a parte pelo índice (apenas se não for "Quebra")
      const partsWithoutBreak = prev.filter(
        (_, i) => i !== index && _.name.toLowerCase() !== "quebra"
      );

      const usedPercent = partsWithoutBreak.reduce(
        (acc, p) => acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
        0
      );

      return [
        ...partsWithoutBreak,
        {
          name: "Quebra",
          percentage: Math.max(0, 100 - usedPercent),
          weight: 0,
        },
      ];
    });
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

        // Recalcula o peso das partes baseadas no novo peso total
        const updatedParts = selectedPattern.parts.map((p: any) => ({
          name: p.name,
          percentage: p.percentage,
          weight: parseFloat(((numericWeight * p.percentage) / 100).toFixed(2)),
          price: parseFloat(prev.price) || 0,
          sellPrice: parseFloat(prev.sellPrice) || 0,
          isActive: true,
        }));
        setParts(updatedParts);
      }

      // Se price ou sellPrice mudam, atualiza nos parts gerados
      if (
        type === "number" &&
        (name === "price" || name === "sellPrice") &&
        selectedPattern
      ) {
        setParts((prevParts) =>
          prevParts.map((p) => ({
            ...p,
            [name]: parseFloat(value) || 0,
          }))
        );
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

    setFormData((prev: any) => ({
      ...prev,
      patternId,
      title: pattern.name,
      categoryId: pattern.categoryId,
    }));

    const numericWeight = parseFloat(formData.weight) || 0;
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

  // 🔹 Novo comportamento ao salvar
  const handleSubmit = () => {
    let adjustedParts = [...parts];

    // Se for um produto sem padrão, cria uma part espelhando os dados principais
    if (type === "posts" && !selectedPattern) {
      adjustedParts = [
        {
          name: formData.title || "Produto",
          weight: parseFloat(formData.weight) || 0,
          price: parseFloat(formData.price) || 0,
          sellPrice: parseFloat(formData.sellPrice) || 0,
          percentage: 100,
          isActive: formData.isActive ?? true,
        },
      ];
    }

    // Remove "Quebra" do payload final se for um post com padrão, já que é apenas visual
    if (type === "posts" && selectedPattern) {
      adjustedParts = parts.filter((p) => p.name.toLowerCase() !== "quebra");
    }

    const quebraPart = adjustedParts.find(
      (p) => p.name.toLowerCase().trim() === "quebra"
    );

    const totalSold =
      mode === "create"
        ? (formData.sold || 0) + (quebraPart?.weight ?? 0)
        : formData.sold || 0;

    // Remove campos quebra/porcentagem se for salvar um post
    const finalPartsPayload =
      type === "posts"
        ? adjustedParts.map((p) => ({
            name: p.name,
            weight: p.weight,
            price: p.price,
            sellPrice: p.sellPrice,
            isActive: p.isActive,
          }))
        : adjustedParts; // Mantém % e quebra para patterns

    const payload = {
      ...formData,
      // Se for posts e não tiver padrão, a quebra não existe.
      sold:
        type === "posts" && !selectedPattern ? formData.sold || 0 : totalSold,
      parts: finalPartsPayload,
    };

    onSubmit(payload);
    onClose();
  };

  // 🔹 Validação do botão Salvar
  const isSaveDisabled = (() => {
    if (type === "posts") {
      return (
        !(formData.title || formData.name) ||
        !formData.price ||
        !formData.weight ||
        !formData.categoryId
      );
    } else if (type === "patterns") {
      const totalPercent = parts.reduce(
        (acc, p) => acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
        0
      );
      // Verifica se o total de porcentagem é 100%
      const isTotal100 = totalPercent >= 99.9 && totalPercent <= 100.1;

      // Verifica se todas as partes têm nome (exceto quebra)
      const hasEmptyName = parts.some(
        (p) => p.name.toLowerCase() !== "quebra" && !p.name
      );

      return (
        !formData.name || !formData.categoryId || !isTotal100 || hasEmptyName
      );
    }
    return !formData.name;
  })();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row justify-between items-center pr-3">
          <CardTitle className="capitalize text-xl">
            {mode === "edit" ? "Editar" : "Adicionar"}{" "}
            {type === "" ? "item" : type.slice(0, -1)}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto flex-1 pb-4">
          {" "}
          {/* Adicionado overflow-y-auto */}
          {/* Campos principais (gerais) */}
          {primaryFields.map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium mb-1">{field.label}</label>
              <Input
                name={field.name}
                type={field.type || "text"}
                placeholder={field.placeholder}
                value={
                  field.type === "checkbox"
                    ? formData[field.name] ?? false
                    : formData[field.name] ?? ""
                }
                onChange={handleChange}
                disabled={field.name === "title" && selectedPattern}
              />
            </div>
          ))}
          {/* --------------------------- Posts --------------------------- */}
          {type === "posts" && (
            <>
              {/* Campos de Seleção (Categoria/Padrão/Disponível) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Categoria */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">
                    Categoria *
                  </label>
                  <NativeSelect
                    name="categoryId"
                    value={formData.categoryId || ""}
                    onChange={handleChange}
                  >
                    <option value="">
                      {loading && categories.length === 0
                        ? "Carregando..."
                        : "Selecione..."}
                    </option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                {/* Padrão */}
                {patterns.length > 0 && (
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Padrão</label>
                    <NativeSelect
                      name="patternId"
                      value={formData.patternId || ""}
                      onChange={handlePatternSelect}
                    >
                      <option value="">Nenhum</option>
                      {patterns.map((pattern: any) => (
                        <option key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                )}

                {/* Disponível (isActive) */}
                {isActiveField && (
                  <div className="flex items-end h-full pt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={isActiveField.name}
                        name={isActiveField.name}
                        checked={formData[isActiveField.name] ?? true}
                        onCheckedChange={(checked) =>
                          handleChange({
                            target: {
                              name: isActiveField.name,
                              value: checked,
                              type: "checkbox",
                            },
                          } as React.ChangeEvent<HTMLInputElement>)
                        }
                      />
                      <label
                        htmlFor={isActiveField.name}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {isActiveField.label}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Campos de Valores (Preço/Venda/Peso) - Lado a Lado */}
              <div className="grid grid-cols-2 gap-3">
                {priceFields.map((field) => (
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

                {weightField && (
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      {weightField.label} *
                    </label>
                    <Input
                      name={weightField.name}
                      type={weightField.type || "text"}
                      placeholder={weightField.placeholder}
                      value={formData[weightField.name] || ""}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              {/* Partes Geradas (apenas visualização) */}
              {selectedPattern && parts.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-base font-semibold mb-2">
                    Detalhes das Partes:
                  </h4>
                  <div className="max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50 space-y-1">
                    <ul className="text-sm">
                      {parts.map((p, i) => (
                        <li
                          key={i}
                          className="flex justify-between border-b last:border-b-0 py-1"
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="text-gray-600">
                            {p.percentage ? `${p.percentage}%` : ""}
                            {p.weight !== undefined && ` | ${p.weight}kg`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
          {/* --------------------------- Patterns --------------------------- */}
          {type === "patterns" && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Categoria *</label>
                <NativeSelect
                  name="categoryId"
                  value={formData.categoryId || ""}
                  onChange={handleChange}
                >
                  <option value="">
                    {loadingCategories && categories.length === 0
                      ? "Carregando categorias..."
                      : "Selecione uma categoria"}
                  </option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <h4 className="text-base font-semibold pt-2">
                Partes do Padrão (%)
              </h4>

              {/* Container de Scroll para Partes Dinâmicas */}
              <div className="max-h-60 overflow-y-auto space-y-3 p-2 border rounded-md">
                {parts.map((part, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Nome da parte"
                      value={part.name}
                      onChange={(e) =>
                        handlePartChange(index, "name", e.target.value)
                      }
                      disabled={part.name.toLowerCase() === "quebra"}
                    />
                    <div className="flex items-center w-24">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="%"
                        value={part.percentage}
                        disabled={part.name.toLowerCase() === "quebra"}
                        onChange={(e) =>
                          handlePartChange(index, "percentage", e.target.value)
                        }
                        className="pr-6"
                      />
                      <span className="absolute right-2 text-sm text-gray-500">
                        %
                      </span>
                    </div>

                    {part.name.toLowerCase() !== "quebra" ? (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemovePart(index)}
                        className="shrink-0"
                      >
                        ✕
                      </Button>
                    ) : (
                      <div className="w-10 shrink-0"></div> // Espaço vazio para alinhar
                    )}
                  </div>
                ))}
              </div>
              {/* Fim do Container de Scroll */}

              <div className="text-sm text-muted-foreground mt-1 font-medium">
                Soma total:{" "}
                {parts
                  .reduce(
                    (acc, p) =>
                      acc + (parseFloat(p.percentage?.toString() ?? "") || 0),
                    0
                  )
                  .toFixed(2)}
                %
              </div>

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
          {/* Botão de Salvar sempre no final */}
          <Button
            className="w-full sticky bottom-0 z-10"
            onClick={handleSubmit}
            disabled={isSaveDisabled}
          >
            {mode === "edit" ? "Salvar alterações" : "Salvar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
