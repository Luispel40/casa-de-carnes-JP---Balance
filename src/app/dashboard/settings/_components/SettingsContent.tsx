"use client";

import { useSession } from "next-auth/react";
import { useSettings } from "./SettingsProvider";
import UserForm from "../../profile/_components/userForm";
import EmployeesForm from "./forms/EmployeesForm";
import CategoriesForm from "./forms/CategoriesForm";
import PostsForm from "./forms/PostsForm";
import PatternsTable from "./forms/PatternForm";

export default function SettingsContent() {
  const { data: session } = useSession();
  const { activeTab } = useSettings();

  const userId = session?.user?.id;

  const renderContent = () => {
    switch (activeTab) {
      case "user":
        return <UserForm userId={userId!} />;
      case "employees":
        return <EmployeesForm />;
      case "categories":
        return <CategoriesForm />;
      case "posts":
        return <PostsForm />;
      case "parts":
        return <div>🧩 Formulário de Partes</div>;
      case "patterns":
        return <PatternsTable />;
      default:
        return <p>Selecione uma aba no menu lateral.</p>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">
        {activeTab === "user" && "Perfil do Usuário"}
        {activeTab === "employees" && "Funcionários"}
        {activeTab === "categories" && "Categorias"}
        {activeTab === "posts" && "Posts"}
        {activeTab === "parts" && "Partes"}
        {activeTab === "patterns" && "Padrões"}
      </h1>

      <div className="bg-white shadow rounded-lg p-6 border min-h-[300px]">
        {renderContent()}
      </div>
    </div>
  );
}
