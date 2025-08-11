"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
import ThemeToggle from "@/components/ThemeToggle";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .refine((val) => val.split("@")[1]?.toLowerCase() === "bennett.edu.in", {
      message: "Please use your Bennett official email ID",
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again in a few minutes.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email.',
  };
  
  return errorMessages[errorCode] || 'Login failed. Please check your credentials and try again.';
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailVerificationError, setShowEmailVerificationError] = useState(false);
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState("");
  
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginForm) => {
    if (isLoading || isSubmitting) return;
    
    setIsLoading(true);
    setShowEmailVerificationError(false); // Reset verification error state
    setLastAttemptedEmail(data.email); // Store email for potential resend
    
    try {
      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      const user = userCredential.user;

      // Force refresh user data to get latest verification status
      await user.reload();

      // Check if email is verified
      if (!user.emailVerified) {
        console.log("Email not verified for user:", user.uid);
        
        // Show specific error for unverified email
        toast.error(
          "Please verify your email before signing in. Check your inbox and spam folder.",
          { duration: 7000 }
        );
        
        // Show resend option
        setShowEmailVerificationError(true);
        
        // Sign out the user immediately
        await signOut(auth);
        return;
      }

      // Check if user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.log("User document not found for:", user.uid);
        toast.error("User profile not found. Please contact support or try signing up again.");
        await signOut(auth);
        return;
      }

      const userData = userDoc.data();

      
      await updateDoc(userDocRef, {
        lastSignIn: serverTimestamp(),
        emailVerified: true, 
      });

      console.log("User signed in successfully:", user.uid);
      toast.success(`Welcome back, ${userData.firstName}!`);
      
      
      setShowEmailVerificationError(false);
      
 
      router.replace("/dashboard");
      
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);
      
      // Handle specific error cases
      if (error.code === 'auth/invalid-credential') {
        toast.error("Invalid email or password. Please check your credentials.");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many failed login attempts. Please wait a few minutes before trying again.");
      } else {
        toast.error(getErrorMessage(error.code));
      }
      
      // Hide resend option for non-verification errors
      setShowEmailVerificationError(false);
      
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-primary/10 p-4 relative">
      <div className="absolute inset-0 bg-grid-slate-100 pointer-events-none dark:bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"/>

      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Card className="border border-border/50 shadow-2xl bg-card/80 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <Link href="/" className="flex flex-col items-center space-y-2">
              <Image src="/logo.png" alt="Raahi Logo" width={80} height={40} />
              <span className="text-2xl font-bold gradient-text">Raahi</span>
            </Link>
            <div>
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to your Raahi account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Bennett Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.name@bennett.edu.in"
                    className="pl-10"
                    {...register("email")}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    {...register("password")}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || isSubmitting}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {showEmailVerificationError && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Email Verification Required
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Your email address hasn't been verified yet. Please check your inbox 
                        and spam folder for the verification email we sent when you signed up.
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Email: {lastAttemptedEmail}
                      </p>
                    
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Sign up with Bennett email
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>
            By signing in, you agree to our{" "}
            <Link href="/terms-and-conditions" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
