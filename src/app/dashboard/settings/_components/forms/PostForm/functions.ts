export const MARGIN_PERCENTAGE = 0.4;

import type { Pattern, PostPart, Category } from "./hooks";

export const calculatePartsFromPattern = (pattern: Pattern, weight: number, price: number, categiries: Category[]): PostPart[] => {
  const categoryIsSpecial = categiries.find(c => c.id === pattern.categoryId)?.special || false;
  let parts: PostPart[] = []; // 👈 Inicializa 'parts' fora da condição

  // ✅ CORREÇÃO: Aplicar `return` ou atribuir a `parts` para ser usado globalmente.
  if (categoryIsSpecial) {
    parts = pattern.parts.map(p => ({
      name: p.name,
      percentage: p.percentage,
      // ✅ Peso calculado baseado na porcentagem
      weight: parseFloat(((weight * p.percentage) / 100).toFixed(2)),
      price: 0,
      isActive: true,
    }));
  } else { // 👈 Garante que o cálculo ocorra para categorias normais
    parts = pattern.parts.map(p => ({
      name: p.name,
      percentage: p.percentage,
      // ✅ Peso calculado baseado na porcentagem
      weight: parseFloat(((weight * p.percentage) / 100).toFixed(2)),
      price,
      isActive: true,
    }));
  }

  // ✅ CÁLCULO DO SELLPRICE NAS PARTS
  parts = parts.map(p => ({
    ...p,
    // Garante que a parte tenha um sellPrice baseado no seu preço (0 ou preço total)
    // O preço de venda deve ser 40% acima do preço de custo (price)
    sellPrice: parseFloat(((p.price ?? price) * (1 + MARGIN_PERCENTAGE)).toFixed(2)),
  }));

  // Lógica de "Quebra"
  const usedPercent = parts.reduce((sum, p) => sum + p.percentage, 0);
  if (usedPercent < 100 && !categoryIsSpecial) {
    // Cálculo do peso para "Quebra"
    const breakWeight = parseFloat(((weight * (100 - usedPercent)) / 100).toFixed(2));
    const breakPercentage = parseFloat((100 - usedPercent).toFixed(2));
    
    parts.push({
      name: "Quebra",
      percentage: breakPercentage,
      weight: breakWeight,
      price: 0,
      isActive: true,
      // SellPrice para Quebra (price = 0)
      sellPrice: parseFloat((0 * (1 + MARGIN_PERCENTAGE)).toFixed(2)),
    });
  }
  

  return parts;
};

export const mergeParts = (
  existing: PostPart[],
  added: PostPart[],
  price: number
): PostPart[] => {
  const merged = [...existing];

  added.forEach(p => {
    const match = merged.find(mp => mp.name.toLowerCase() === p.name.toLowerCase());
    
    if (match) {
      // ✅ 1. Soma o peso (requisito anterior e mantido)
      match.weight = parseFloat((match.weight + p.weight).toFixed(2));
      
      // ✅ 2. Atualiza o preço (requisito da edição)
      match.price = price;
      
      // ❌ 3. NÃO altera o sellPrice, mantendo o valor existente (NOVO REQUISITO)
      // match.sellPrice é mantido.
    } else {
      merged.push({
        ...p,
        price, // usa o novo preço
        // Garante que sellPrice seja calculado se não existir
        sellPrice: p.sellPrice ?? parseFloat((price * (1 + MARGIN_PERCENTAGE)).toFixed(2)),
      });
    }
  });

  // Recalcula o total com os novos pesos
  const totalWeight = merged.reduce((sum, p) => sum + p.weight, 0);

  return merged.map(p => ({
    ...p,
    // Recálculo da porcentagem baseado no novo peso total
    percentage: parseFloat(((p.weight / totalWeight) * 100).toFixed(2)),
    price, // garante coerência (preço de custo do post)
    // ✅ Mantém o sellPrice existente ou o que foi calculado ao ser adicionada
    sellPrice: p.sellPrice,
  }));
};