"use client";

import { useSession } from "next-auth/react";
import { useSettings } from "./SettingsProvider";
import UserForm from "../../profile/_components/userForm";
import EmployeesForm from "./forms/EmployeesForm";
import CategoriesForm from "./forms/CategoriesForm";
import PostsForm from "./forms/PostsForm";
import PatternsTable from "./forms/PatternForm";
import { Button } from "@/_components/ui/button";
import { ChevronLeft } from "lucide-react";
import PostsFormTest from "./forms/PostForm/page";

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
        return <PostsFormTest />;
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
        {activeTab === "patterns" && "Padrões"}
      </h1>

      <div className="bg-transparent p-0 border min-h-[300px] border-none">
        <Button variant="outline" className="mb-2" onClick={() => history.back()}>
          <ChevronLeft className="mr-0" />
        </Button>
        {renderContent()}
      </div>
    </div>
  );
}
