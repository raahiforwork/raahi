"use client";

import { useLoading } from "@/context/LoadingContext";
import LoadingScreen from "./LoadingScreen";

export default function LoadingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useLoading();

  return (
    <>
      {children}
      {isLoading && <LoadingScreen />}
    </>
  );
}
