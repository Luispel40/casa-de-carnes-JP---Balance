"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Tab = "user"  | "categories" | "posts" | "parts" | "patterns";

interface SettingsContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>("user");

  return (
    <SettingsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings deve ser usado dentro de um SettingsProvider");
  }
  return context;
}
