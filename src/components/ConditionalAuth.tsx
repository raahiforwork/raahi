"use client";

import { AuthProvider } from "@/context/AuthContext";

export default function ConditionalAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
