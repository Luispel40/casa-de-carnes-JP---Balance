"use client";

import { Button } from "@/_components/ui/button";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const HeaderPage = () => {
  const { data: session } = useSession();
  return (
    <div className="w-full p-6 border-b border-gray-300 dark:border-gray-700">
      <div className="flex w-full md:w-[600px] m-auto items-center justify-between">
        <Link href="/dashboard" className="min-w-8 max-w-8 min-h-8 max-h-8">
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="m-auto"
          />
        </Link>
        {session ? (
          <Button onClick={() => signOut()} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            {session.user?.name}
          </Button>
        ) : (
          <Link href="/login">
            <Button>
              <LogOut className="mr-2 h-4 w-4" />
              Login
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default HeaderPage;
