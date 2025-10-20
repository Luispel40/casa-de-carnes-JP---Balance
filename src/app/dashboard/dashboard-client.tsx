"use client"

import { signOut } from "next-auth/react"

export default function DashboardClient({ user }: { user: any }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Bem-vindo, {user?.name || "Usuário"}</h1>
      <p className="text-gray-600">Email: {user?.email}</p>
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2"
      >
        Sair
      </button>
    </main>
  )
}
