"use client";

import Image from "next/image";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile, 
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
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z
  .object({
    firstName: z.string().min(3, "First name must be at least 3 characters"),
    lastName: z.string().min(3, "Last name must be at least 3 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .refine((val) => val.split("@")[1]?.toLowerCase() === "bennett.edu.in", {
        message: "Only Bennett official email IDs are allowed",
      }),
    phone: z.string().min(10, "Please enter a valid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
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

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const agreeToTerms = watch("agreeToTerms");

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);

    try {
 
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      const user = userCredential.user;

   
      await updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      await sendEmailVerification(user);


      await setDoc(doc(db, "users", user.uid), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        displayName: `${data.firstName} ${data.lastName}`, 
        isVerified: false,
        createdAt: serverTimestamp(),
      });

      toast.success(
        "Account created! Please verify your email before logging in.",
      );
      reset();
    } catch (err: any) {
      const errorCode = err.code;
      if (errorCode === "auth/email-already-in-use") {
        toast.error("This email is already in use.");
      } else if (errorCode === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };


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
              Create your account to start sharing rides
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form
              onSubmit={handleSubmit(onSubmit, (formErrors) => {
                const firstError = Object.values(formErrors)[0];
                if (firstError?.message) {
                  toast.error(firstError.message as string);
                }
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name</Label>
                  <Input placeholder="John" {...register("firstName")} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input placeholder="Doe" {...register("lastName")} />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  placeholder="john@bennett.edu.in"
                  {...register("email")}
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input placeholder="+91 98765 43210" {...register("phone")} />
              </div>

              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-2 top-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-2 top-1"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setValue("agreeToTerms", true);
                    }
                  }}
                />
                <Label htmlFor="agreeToTerms" className="text-sm">
                  I agree to the{" "}
                  <Link href="" className="text-primary hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href=""
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Registering..." : "Create Account"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
