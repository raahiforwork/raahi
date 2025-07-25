"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaSearch,
  FaCar,
  FaPlus,
  FaUserCircle,
} from "react-icons/fa";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/dashboard"
          className={`bottom-nav-item flex flex-col items-center text-sm p-3 rounded-full ${
            isActive("/dashboard")
              ? "bg-green-500 text-white shadow-md shadow-green-400"
              : "text-black hover:bg-green-200"
          }`}
        >
          <FaHome className="text-xl mb-1" />
          <span>Home</span>
        </Link>

        <Link
          href="/dashboard/find"
          className={`bottom-nav-item flex flex-col items-center text-sm p-3 rounded-full ${
            isActive("/dashboard/find")
              ? "bg-green-500 text-white shadow-md shadow-green-400"
              : "text-black hover:bg-green-200"
          }`}
        >
          <FaSearch className="text-xl mb-1" />
          <span>Find</span>
        </Link>

        <Link
          href="/dashboard/offer"
          className="bottom-nav-item flex flex-col items-center text-sm text-black relative mb-7"
        >
          <div
            className={`absolute -top-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white hover:border-black ${
              isActive("/dashboard/offer")
                ? "bg-green-500 shadow-green-400"
                : "bg-green-500 hover:bg-green-400"
            }`}
          >
            <FaPlus className="text-black text-lg" />
          </div>
        </Link>

        <Link
          href="/rides"
          className={`bottom-nav-item flex flex-col items-center text-sm p-3 rounded-full ${
            isActive("/rides")
              ? "bg-green-500 text-white shadow-md shadow-green-400"
              : "text-black hover:bg-green-200"
          }`}
        >
          <FaCar className="text-xl mb-1" />
          <span>My Rides</span>
        </Link>

        <Link
          href="/dashboard/profile"
          className={`bottom-nav-item flex flex-col items-center text-sm p-3 rounded-full ${
            isActive("/dashboard/profile")
              ? "bg-green-500 text-white shadow-md shadow-green-400"
              : "text-black hover:bg-green-200"
          }`}
        >
          <FaUserCircle className="text-xl mb-1" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}