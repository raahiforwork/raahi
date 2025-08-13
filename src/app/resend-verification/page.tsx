"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ResendVerification from "@/components/ResendVerification";
import { Mail, ArrowLeft } from "lucide-react";


export default function ResendVerificationPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link
          href="/login"
          className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </Link>
       
      </div>

      <Card className="w-full max-w-md border shadow-lg bg-card/80 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Resend Verification Email</CardTitle>
          <CardDescription>
            Enter your Bennett email address to receive a new verification link
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Bennett Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@bennett.edu.in"
              className="mt-1"
            />
          </div>

          <ResendVerification
            email={email}
            onSuccess={() => {
              // Could redirect to login or show success message
            }}
          />

          <div className="text-center pt-4 border-t">
            <Link 
              href="/login" 
              className="text-sm text-primary hover:underline"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
