"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";


export default function VerifyEmailPage() {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  
  const userId = searchParams.get("uid");
  const userEmail = searchParams.get("email");
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    if (!userId) {
      toast.error("Invalid verification link");
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          verificationCode
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsVerified(true);
        toast.success("Email verified successfully!");
        
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 2000);
      } else {
        toast.error(result.message || "Verification failed");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || !userEmail || !firstName || !lastName || !userId) {
      toast.error("Cannot resend code at this time");
      return;
    }

    setIsResending(true);
    setCanResend(false);
    setCountdown(180);

    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const updateResponse = await fetch("/api/update-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          verificationCode: newCode
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to generate new code");
      }

      const emailResponse = await fetch("/api/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          firstName,
          lastName,
          verificationCode: newCode
        }),
      });

      if (emailResponse.ok) {
        toast.success("New verification code sent!");
        setVerificationCode("");
      } else {
        throw new Error("Failed to send code");
      }
    } catch (error) {
      toast.error("Failed to resend code. Please try again.");
      setCanResend(true);
      setCountdown(0);
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-lg bg-card/80 backdrop-blur">
          <CardHeader className="text-center space-y-4">
      
            <Link href="/" className="flex flex-col items-center space-y-2">
              <Image src="/logo.png" alt="Raahi Logo" width={64} height={64} className="object-contain rounded" />
              <span className="text-xl font-bold gradient-text">Raahi</span>
            </Link>
            
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300">
              Email Verified Successfully!
            </CardTitle>
            <CardDescription>
              Redirecting you to login page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
          {/* Raahi Logo */}
          <Link href="/" className="flex flex-col items-center space-y-2">
            <Image src="/logo.png" alt="Raahi Logo" width={64} height={64} className="object-contain rounded" />
            <span className="text-xl font-bold gradient-text">Raahi</span>
          </Link>
          
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your Bennett email address
          </CardDescription>
          {userEmail && (
            <p className="text-xs text-muted-foreground font-mono">
              {userEmail}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                disabled={isVerifying}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Code expires in 10 minutes
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isVerifying || verificationCode.length !== 6}
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the code?
            </p>
            <Button
              onClick={handleResendCode}
              disabled={!canResend || isResending}
              variant="outline"
              size="sm"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Code
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
