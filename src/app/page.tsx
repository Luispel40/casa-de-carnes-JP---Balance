"use client"

import { signOut, useSession } from "next-auth/react"
import { redirect } from "next/navigation"

export default function Home() {
  const { data: session } = useSession()

  if (!session) {
      redirect("/login")
    }

  return (
    <main className="flex flex-col items-center gap-4 mt-10">
      <h1>Olá, {session.user?.name}</h1>
      <button onClick={() => signOut()} className="bg-gray-300 px-4 py-2 rounded">
        Sair
      </button>
    </main>
  )
}
