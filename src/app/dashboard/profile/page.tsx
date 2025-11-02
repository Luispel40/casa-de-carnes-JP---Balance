import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/_components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ajuste o caminho se necessário
import UserForm from "./_components/userForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="text-center text-gray-600 mt-10">
        É necessário estar autenticado para acessar o perfil.
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-10">
      <Card className="w-full max-w-md bg-white shadow-md">
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>Atualize suas informações abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm userId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
