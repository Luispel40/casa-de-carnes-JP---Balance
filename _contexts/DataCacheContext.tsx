"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  userId: string;
}

interface Pattern {
  id: string;
  name: string;
  categoryId: string;
  userId: string;
  parts: any[];
}

interface DataCacheContextType {
  categories: Category[];
  patterns: Pattern[];
  loading: boolean;
  fetchCategories: (userId: string) => Promise<void>;
  fetchPatterns: (userId: string) => Promise<void>;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(
  undefined
);

export const DataCacheProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async (userId: string) => {
    if (categories.length > 0) return; // ✅ já temos cache
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatterns = async (userId: string) => {
    if (patterns.length > 0) return; // ✅ cache
    setLoading(true);
    try {
      const res = await fetch(`/api/patterns/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPatterns(data);
      }
    } catch (err) {
      console.error("Erro ao buscar padrões:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataCacheContext.Provider
      value={{ categories, patterns, loading, fetchCategories, fetchPatterns }}
    >
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const ctx = useContext(DataCacheContext);
  if (!ctx) {
    throw new Error("useDataCache deve ser usado dentro de <DataCacheProvider>");
  }
  return ctx;
};
