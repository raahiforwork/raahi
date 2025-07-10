"use client";

import Image from "next/image";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function InnerNavbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <nav className="z-50 fixed top-0 left-0 w-full bg-black text-green-800 px-6 py-2 flex justify-between items-center shadow-lg shadow-gray-800">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/logo.png"
          alt="Raahi Logo"
          width={48}
          height={48}
          className="object-fill"
        />
        <span className="text-xl font-bold gradient-text">Raahi</span>
      </Link>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {user && (
      <>
        <Link href="/chat">
          <Button className="bg-green-100 text-green-800 hover:bg-green-200">
            Chat
          </Button>
        </Link>
        <Button
          onClick={handleLogout}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          Logout
        </Button>
      </>
    )}
      </div>
    </nav>
  );
}
