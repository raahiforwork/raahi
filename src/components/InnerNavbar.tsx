"use client";

import Image from "next/image";
import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
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
    <>
      {/* Navbar */}
      <nav className="z-50 fixed top-0 left-0 w-full bg-black text-green-800 px-6 py-2 flex justify-between items-center shadow-lg shadow-gray-800">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo.png"
            alt="Raahi Logo"
            width={32}
            height={32}
            style={{
              width: "auto",
              height: "32px",
            }}
            className="rounded-lg"
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

      {/* Floating Install Button - Positioned above mobile navbar */}
      {/* {isInstallable && !isInstalled && (
        <div className="fixed left-6 z-50 bottom-6 md:bottom-6 sm:bottom-20">
          <Button
            onClick={handleInstallClick}
            className="bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 rounded-full px-4 py-3"
          >
            <Download size={20} />
            Install App
          </Button>
        </div>
      )} */}
    </>
  );
}
