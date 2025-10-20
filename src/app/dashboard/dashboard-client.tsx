"use client";

import { Button } from "@/_components/ui/button";
import { signOut } from "next-auth/react";
import { ToggleGroupButtons } from "../_components/toggleGroup/page";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";

export default function DashboardClient({ user }: { user: any }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">
        Bem-vindo, {user?.name || "Usuário"}
      </h1>
      <ToggleGroupButtons />
      <Card className="w-96">
        <CardHeader>
          <CardTitle>{user?.name || "Usuário"}</CardTitle>
          <CardDescription>{user?.email || "Email"}
            <br /> 
            {user?.role || "Role"}
          </CardDescription>
          <CardAction>Card Action</CardAction>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
      <Button onClick={() => signOut()} variant="destructive" className="mt-4">
        Logout
      </Button>
    </main>
  );
}
