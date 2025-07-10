"use client";

import { Loader2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-carpool-500 to-carpool-600 shadow-lg">
            <span className="text-xl font-bold text-white">R</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Raahi</span>
        </div>

        
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-carpool-600" />
          <div className="absolute inset-0 h-8 w-8 rounded-full border-2 border-carpool-200 animate-pulse" />
        </div>

        
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">Loading...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we prepare your experience
          </p>
        </div>

     
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-carpool-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-carpool-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-carpool-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
