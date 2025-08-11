"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { applyActionCode } from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import Head from "next/head";

export default function CompleteVerificationPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const oobCode = searchParams?.get('oobCode');
  const mode = searchParams?.get('mode');

  useEffect(() => {
    if (searchParams && (!oobCode || mode !== 'verifyEmail')) {
      toast.error("Invalid verification link. Redirecting to homepage.");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  }, [searchParams, oobCode, mode, router]);

  useEffect(() => {
    if (searchParams && mode === 'verifyEmail' && oobCode) {
      handleEmailVerification(oobCode);
    } else if (searchParams && (!oobCode || mode !== 'verifyEmail')) {
      setStatus('error');
      setErrorMessage('Invalid verification link');
    }
  }, [searchParams, mode, oobCode]);

  const handleEmailVerification = async (actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      
      const user = auth.currentUser;
      
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          isVerified: true,
          emailVerified: true,
          emailVerifiedAt: serverTimestamp(),
          verificationPending: false
        });
      } else {
        console.log("Email verified but user not currently signed in");
      }
      
      setStatus('success');
      toast.success("Email verified successfully!");
      
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 3000);
      
    } catch (error: any) {
      console.error("Verification error:", error);
      setStatus('error');
      
      if (error.code === 'auth/expired-action-code') {
        setErrorMessage('Verification link expired. Please request a new verification email.');
      } else if (error.code === 'auth/invalid-action-code') {
        setErrorMessage('Invalid verification link. This link may have already been used.');
      } else {
        setErrorMessage('Email verification failed. Please try again.');
      }
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
                <p>Loading verification...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (status === 'processing') {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Email Verification - Processing</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Verifying your email...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a few seconds
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (status === 'success') {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
          <title>Email Verification - Success</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle>Email Verified Successfully!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Your email has been successfully verified. You can now sign in to your Raahi account.</p>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>🎉 Welcome to Raahi!</strong><br />
                  Your account is now fully activated and ready to use.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page in a few seconds...
              </p>
              <Button onClick={() => router.push("/login?verified=true")} className="w-full">
                Go to Login Now
              </Button>
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
        <title>Email Verification - Error</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Verification Failed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{errorMessage}</p>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Need help?</strong><br />
                If you continue having issues, try requesting a new verification email from the signup page.
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={() => router.push("/signup")} className="w-full">
                Back to Signup
              </Button>
              <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
                Try Login Anyway
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}