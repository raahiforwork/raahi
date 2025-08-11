"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  ActionCodeSettings,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .refine((val) => val.split("@")[1]?.toLowerCase() === "bennett.edu.in", {
        message: "Only Bennett official email IDs are allowed",
      }),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be less than 15 digits")
      .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must agree to the terms and conditions",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/too-many-requests': 'Too many requests. Please try again in a few minutes.',
    'auth/internal-error': 'An internal error occurred. Please try again.',
  };
  
  return errorMessages[errorCode] || 'Registration failed. Please try again.';
};

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const agreeToTerms = watch("agreeToTerms");

  const onSubmit = async (data: SignupForm) => {
    if (isLoading || isSubmitting) return;
    
    setIsLoading(true);
    
    try {
      console.log("Starting signup process for:", data.email);
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      const user = userCredential.user;
      console.log("User created with UID:", user.uid);

      
      await updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: false,
      };

      
      await sendEmailVerification(user, actionCodeSettings);
      console.log("Verification email sent to:", data.email);

      
      await setDoc(doc(db, "users", user.uid), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        displayName: `${data.firstName} ${data.lastName}`,
        emailVerified: false,
        isVerified: false,
        verificationEmailSent: true,
        verificationEmailSentAt: serverTimestamp(),
        verificationEmailResendCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("User document created in Firestore");

      
      await signOut(auth);
      console.log("User signed out after registration");

  
      setUserEmail(data.email);
      setSignupSuccess(true);

      toast.success(
        "Account created successfully! Please check your email (including spam folder) and verify your account before signing in.",
        { duration: 8000 }
      );
      
      
      reset();

    
      setTimeout(() => {
        router.push("/login?signup=success");
      }, 3000);

    } catch (err: any) {
      console.error("Signup error:", err.code, err.message);
      
      
      if (err.code === 'auth/email-already-in-use') {
        toast.error(
          "This email is already registered. Please sign in instead or use a different email.",
          { duration: 6000 }
        );
      } else {
        toast.error(getErrorMessage(err.code));
      }
      
      
      setSignupSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  const handleTermsChange = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setValue("agreeToTerms", true);
    }
  };

  // Success state UI
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-lg bg-card/80 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300">
              Account Created!
            </CardTitle>
            <CardDescription className="text-center">
              Welcome to Raahi! Your account has been created successfully.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Verification Email Sent
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                We've sent a verification link to:
              </p>
              <p className="text-sm font-mono bg-blue-100 dark:bg-blue-900 p-2 rounded mt-2 text-blue-900 dark:text-blue-100">
                {userEmail}
              </p>
            </div>
            
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <p className="font-medium">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Check your email inbox</li>
                <li>Look in spam/junk folder if not found</li>
                <li>Click the verification link</li>
                <li>Return to sign in</li>
              </ol>
            </div>
            
            <Button 
              onClick={() => router.push("/login")}
              className="w-full"
              variant="outline"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
        <Card className="border shadow-lg bg-card/80 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <div className="flex flex-col items-center text-center space-y-4">
              <Image
                src="/logo.png"
                alt="Raahi Logo"
                width={64}
                height={64}
                className="object-contain rounded"
              />
              <CardTitle className="text-2xl font-bold gradient-text">
                Join Raahi
              </CardTitle>
            </div>
            <CardDescription>
              Create your account with Bennett email to start sharing rides
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName"
                    placeholder="John" 
                    {...register("firstName")} 
                    disabled={isLoading}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName"
                    placeholder="Doe" 
                    {...register("lastName")} 
                    disabled={isLoading}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Bennett Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@bennett.edu.in"
                  {...register("email")}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210" 
                  {...register("phone")} 
                  disabled={isLoading}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    {...register("password")}
                    disabled={isLoading}
                    autoComplete="new-password"
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
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={toggleConfirmPasswordVisibility}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onCheckedChange={handleTermsChange}
                  disabled={isLoading}
                  className="mt-1"
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                  I agree to Raahi's{" "}
                  <Link 
                    href="/terms-and-conditions" 
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.agreeToTerms.message}
                </p>
              )}

              <Button 
                type="submit" 
                disabled={isLoading || isSubmitting} 
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            Only Bennett University official email addresses are accepted
          </p>
        </div>
      </div>
    </div>
  );
}
