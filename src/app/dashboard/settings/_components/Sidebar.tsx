"use client";

import { useSettings } from "./SettingsProvider";
import {
  User,
  Layers,
  Package,
  Users,
  Boxes,
  FileText,
} from "lucide-react";
import clsx from "clsx";

const tabs = [
  { id: "user", name: "Usuário", icon: User },
  { id: "employees", name: "Funcionários", icon: Users },
  { id: "categories", name: "Categorias", icon: Layers },
  { id: "posts", name: "Posts", icon: Package },
  { id: "parts", name: "Partes", icon: Boxes },
  { id: "patterns", name: "Padrões", icon: FileText },
];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useSettings();

  return (
    <aside className="w-60 bg-white border-r shadow-sm flex flex-col">
      <div className="p-4 text-lg font-semibold border-b">Configurações</div>

      <nav className="flex-1 py-3">
        {tabs.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={clsx(
              "flex items-center w-full gap-3 px-4 py-2 text-sm transition-all",
              activeTab === id
                ? "bg-blue-100 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
      </nav>
    </aside>
  );
}
