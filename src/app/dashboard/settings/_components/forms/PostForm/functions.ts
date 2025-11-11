export const MARGIN_PERCENTAGE = 0.4;

import type { Pattern, PostPart, Category } from "./hooks";

export const calculatePartsFromPattern = (pattern: Pattern, weight: number, price: number, categiries: Category[]): PostPart[] => {
  const categoryIsSpecial = categiries.find(c => c.id === pattern.categoryId)?.special || false;
  if (categoryIsSpecial) {
    const parts = pattern.parts.map(p => ({
      name: p.name,
      percentage: p.percentage,
      weight: parseFloat(((weight * p.percentage) / 100).toFixed(2)),
      price: 0,
      isActive: true,
    }));
  } 
    const parts = pattern.parts.map(p => ({
    name: p.name,
    percentage: p.percentage,
    weight: parseFloat(((weight * p.percentage) / 100).toFixed(2)),
    price,
    isActive: true,
  }));

  const usedPercent = parts.reduce((sum, p) => sum + p.percentage, 0);
  if (usedPercent < 100) {
    parts.push({
      name: "Quebra",
      percentage: parseFloat((100 - usedPercent).toFixed(2)),
      weight: parseFloat(((weight * (100 - usedPercent)) / 100).toFixed(2)),
      price: 0,
      isActive: true,
    });
  }
  

  return parts;
};

export const mergeParts = (existing: PostPart[], added: PostPart[], weight: number, price: number): PostPart[] => {
  const merged = [...existing];
  added.forEach(p => {
    const match = merged.find(mp => mp.name.toLowerCase() === p.name.toLowerCase());
    if (match) {
      match.weight += p.weight;
      match.price = price;
    } else {
      merged.push({ ...p, price });
    }
  });

  const totalWeight = merged.reduce((sum, p) => sum + p.weight, 0);
  return merged.map(p => ({
    ...p,
    percentage: parseFloat(((p.weight / totalWeight) * 100).toFixed(2)),
    price,
  }));
};
