"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0); 
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setEmailSent(true);
      setCooldown(180); 
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      
      if (error.code === "auth/user-not-found") {
        toast.error("No user found with this email address.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const email = getValues("email");
    if (!email || cooldown > 0) return;

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent again!");
      setCooldown(180); 
    } catch (error) {
      toast.error("Failed to resend email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4 relative">
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link
          href="/login"
          className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </Link>
       
      </div>

      <div className="w-full max-w-md">
        <Card className="border border-border/50 shadow-2xl bg-card/80 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="flex flex-col items-center space-y-2">
              <Image src="/logo.png" alt="Raahi Logo" width={80} height={40} />
              <span className="text-2xl font-bold gradient-text">Raahi</span>
            </Link>
            <div>
              {!emailSent ? (
                <>
                  <CardTitle className="text-2xl font-bold">
                    Forgot Password?
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Enter your email address and we&apos;ll send you a link to reset
                    your password.
                  </CardDescription>
                </>
              ) : (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <CardTitle className="text-2xl font-bold">
                    Check Your Email
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    We&apos;ve sent a password reset link to your email address.
                  </CardDescription>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!emailSent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn&apos;t receive the email? Check your spam folder or
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={isLoading || cooldown > 0}
                    className="w-full"
                  >
                    {cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : isLoading
                      ? "Sending..."
                      : "Resend Email"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Back to Login
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            By using this service, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
