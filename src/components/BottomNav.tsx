"use client";

import Link from "next/link";
import {
  FaHome,
  FaSearch,
  FaCar,
  FaPlus,
  FaUserCircle,
} from "react-icons/fa";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/dashboard"
          className="bottom-nav-item active flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-full"
        >
          <FaHome className="text-xl mb-1" />
          <span>Home</span>
        </Link>

        <Link
          href="/dashboard/find"
          className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-full"
        >
          <FaSearch className="text-xl mb-1" />
          <span>Find</span>
        </Link>

        <Link
          href="/dashboard/offer"
          className="bottom-nav-item flex flex-col items-center text-sm text-black relative bg-green-500"
        >
          <div className="absolute -top-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 hover:border-black border-white bg-green-500 hover:bg-green-400">
            <FaPlus className="text-black text-lg" />
          </div>
          <FaCar className="text-xl mb-1" />
        </Link>

        <Link
          href="/rides"
          className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-full"
        >
          <FaCar className="text-xl mb-1" />
          <span>My Rides</span>
        </Link>

        <Link
          href="/dashboard/profile"
          className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-full"
        >
          <FaUserCircle className="text-xl mb-1" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}