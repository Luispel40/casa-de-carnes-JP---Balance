"use client";

import { Button } from "@/_components/ui/button";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const HeaderPage = () => {
  return (
    <div className="w-full p-6">
      <div className="flex w-full md:w-[600px] m-auto items-center justify-between">
        <Link href="/dashboard">
        <Image
          src="/logo.png"
          alt="Logo"
          width={100}
          height={100}
          className="m-auto"
        /></Link>
        <Button onClick={() => signOut()} variant="outline">Sair</Button>
      </div>
    </div>
  );
};

export default HeaderPage;
