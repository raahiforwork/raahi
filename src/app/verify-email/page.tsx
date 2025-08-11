"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  ActionCodeSettings,
} from "firebase/auth";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Mail, Clock, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [step, setStep] = useState<
    "validating" | "ready" | "password_required" | "sent" | "expired" | "invalid"
  >("validating");
  const [countdown, setCountdown] = useState(5);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams?.get("token");
  const uid = searchParams?.get("uid");

  useEffect(() => {
    if (searchParams && (!token || !uid)) {
      toast.error("Invalid verification link. Redirecting to signup page.");
      setTimeout(() => {
        router.push("/signup");
      }, 2000);
    }
  }, [searchParams, token, uid, router]);

  useEffect(() => {
    if (searchParams && token && uid) {
      verifyCustomToken(token, uid);
    } else if (searchParams && (!token || !uid)) {
      setStep("invalid");
    }
  }, [searchParams, token, uid]);

  useEffect(() => {
    if (step === "ready" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const verifyCustomToken = async (token: string, uid: string) => {
    try {
      const docRef = doc(db, "pendingVerifications", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.token === token) {
          if (data.expiresAt.toDate() > new Date()) {
            setTokenData(data);
            setStep("password_required");
          } else {
            setStep("expired");
          }
        } else {
          setStep("invalid");
        }
      } else {
        setStep("invalid");
      }
    } catch (error) {
      console.error("Error validating token:", error);
      setStep("invalid");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password || !tokenData) {
      toast.error("Please enter your password");
      return;
    }

    setIsVerifying(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        tokenData.email,
        password
      );

      const user = userCredential.user;

      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/complete-verification`,
        handleCodeInApp: false,
      };

      await sendEmailVerification(user, actionCodeSettings);

      await signOut(auth);

      await deleteDoc(doc(db, "pendingVerifications", tokenData.userId));

      setStep("sent");
      toast.success("Verification email sent! Check your inbox.");

    } catch (error: any) {
      console.error("Password verification error:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error("Incorrect password. Please try again.");
      } else {
        toast.error("Failed to verify credentials. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendNewVerificationEmail = async () => {
    if (!tokenData) return;

    try {
      const newToken = crypto.randomUUID();
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await updateDoc(doc(db, "pendingVerifications", tokenData.userId), {
        token: newToken,
        expiresAt: newExpiry,
        updatedAt: serverTimestamp(),
      });

      const newVerificationUrl = `${window.location.origin}/verify-email?token=${newToken}&uid=${tokenData.userId}`;

      const response = await fetch("/api/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: tokenData.email,
          firstName: tokenData.firstName,
          lastName: tokenData.lastName,
          verificationUrl: newVerificationUrl,
        }),
      });

      if (response.ok) {
        toast.success("New verification email sent! Check your inbox.");
      } else {
        throw new Error("Failed to send email");
      }

    } catch (error) {
      console.error("Resend email error:", error);
      toast.error("Failed to send new verification email. Please try again.");
    }
  };

  if (!searchParams) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Email Verification - Loading</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading verification page...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (step === "validating") {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Email Verification - Validating</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Validating verification link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (step === "invalid") {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Email Verification - Invalid</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Invalid Verification Link</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="mb-4">
                This verification link is invalid or malformed.
              </p>
              <p className="text-sm text-muted-foreground">
                Please ensure you clicked the complete link from your email, or request a new verification email.
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push("/signup")} className="w-full">
                  Back to Signup
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/login")} 
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Expired state
  if (step === "expired") {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Email Verification - Expired</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Link Expired</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="mb-4">
                This verification link has expired (24 hour limit).
              </p>
              <p className="text-sm text-muted-foreground">
                For security reasons, verification links expire after 24 hours. You can request a new verification email below.
              </p>
              <Button onClick={handleResendNewVerificationEmail} className="w-full">
                Send New Verification Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (step === "password_required") {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Email Verification - Confirm Identity</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Your Identity</CardTitle>
              <CardDescription>
                Enter your password to proceed with email verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Email:</strong> {tokenData?.email}
                </p>
                <p className="text-sm">
                  <strong>Name:</strong> {tokenData?.firstName} {tokenData?.lastName}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isVerifying}
                    onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Why we need this:</strong><br />
                  To send you a verification email, we need to temporarily sign you in. 
                  Your password is only used for this verification step.
                </p>
              </div>

              <Button
                onClick={handlePasswordSubmit}
                disabled={isVerifying || !password}
                className="w-full"
              >
                {isVerifying ? "Verifying..." : "Send Verification Email"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (step === "sent") {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Email Verification - Check Your Email</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="h-6 w-6 text-green-600" />
                <CardTitle>Verification Email Sent!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A Firebase verification email has been sent to:
                <strong className="block mt-1">{tokenData?.email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Check your inbox and click the verification link in the email to
                complete the process. If you don&apos;t see it, check your spam folder.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> If you&apos;re using university email (Outlook), 
                  the verification may happen automatically when you receive the email.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePasswordSubmit}
                  disabled={isVerifying}
                  className="w-full"
                >
                  {isVerifying ? "Sending..." : "Resend Verification Email"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <title>Email Verification</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              Preparing email verification...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}