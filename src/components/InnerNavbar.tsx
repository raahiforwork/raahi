"use client";

import Image from "next/image";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";

export default function InnerNavbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="z-50 fixed top-0 left-0 w-full bg-white border-b border-green-100 text-green-800 px-6 py-2 flex justify-between items-center shadow-md">
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

    </nav>
  );
}
