"use client";

import { useState } from "react";
import { useSettings } from "./SettingsProvider";
import {
  User,
  Layers,
  Package,
  Users,
  FileText,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";

const tabs = [
  { id: "user", name: "Usuário", icon: User },
  // { id: "employees", name: "Funcionários", icon: Users },
  { id: "categories", name: "Categorias", icon: Layers },
  { id: "posts", name: "Posts", icon: Package },
  { id: "patterns", name: "Padrões", icon: FileText },
];

export default function Sidebar() {
  const { activeTab, setActiveTab } = useSettings();
  const [isOpen, setIsOpen] = useState(false); // mobile toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // desktop mini mode

  return (
    <>
      {/* Botão de menu mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={clsx(
          "bg-white border-r shadow-sm flex flex-col fixed top-0 left-0 h-full z-50 transition-all duration-300",
          "md:static md:h-auto md:flex-col",
          isCollapsed ? "w-16 md:w-16" : "w-60 md:w-60",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && <span className="text-lg font-semibold">Configurações</span>}
          {/* Botão fechar mobile */}
          <button
            className="md:hidden p-1 rounded hover:bg-gray-200"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <nav className="flex-1 py-3">
          {tabs.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id as any);
                setIsOpen(false);
              }}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 text-sm transition-all w-full overflow-hidden",
                activeTab === id
                  ? "bg-blue-100 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100",
                isCollapsed && "justify-center"
              )}
            >
              <Icon size={18} />
              {!isCollapsed && <span className="truncate">{name}</span>}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
