"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface FloatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function FloatingButton({
  size = "md",
  gradient = true,
  icon,
  children,
  className,
  ...props
}: FloatingButtonProps) {
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <Button
      className={cn(
        "relative overflow-hidden rounded-full border-0 shadow-lg transition-all duration-300",
        "hover:scale-110 hover:shadow-xl hover:shadow-carpool-500/30",
        "active:scale-95",
        gradient &&
          "bg-gradient-to-br from-carpool-500 via-carpool-600 to-carpool-700",
        !gradient && "bg-background border border-border",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
      <div className="relative z-10 flex items-center justify-center">
        {icon}
        {children}
      </div>
    </Button>
  );
}
