"use client";

import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signOut,
  ActionCodeSettings 
} from "firebase/auth";
import { doc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Clock } from "lucide-react";

interface ResendVerificationProps {
  email: string;
  onSuccess?: () => void;
  className?: string;
}

export default function ResendVerification({ 
  email, 
  onSuccess,
  className = "" 
}: ResendVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address is required.");
      return;
    }

    if (!password) {
      setShowPasswordInput(true);
      toast.error("Please enter your password to verify your identity.");
      return;
    }

    if (cooldownTime > 0) {
      toast.error(`Please wait ${cooldownTime} seconds before resending.`);
      return;
    }

    setIsResending(true);

    try {
      // Sign in temporarily to get user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if already verified
      await user.reload();
      if (user.emailVerified) {
        toast.success("Your email is already verified! You can now sign in.");
        await signOut(auth);
        onSuccess?.();
        return;
      }

      // Configure verification email settings
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/login?verified=true`,
        handleCodeInApp: false,
      };

      // Send verification email
      await sendEmailVerification(user, actionCodeSettings);

      // Update Firestore with resend info
      try {
        await updateDoc(doc(db, "users", user.uid), {
          lastVerificationEmailSent: new Date(),
          verificationEmailResendCount: increment(1),
          updatedAt: new Date(),
        });
      } catch (firestoreError) {
        console.log("Firestore update failed, but email sent successfully");
      }

      // Sign out immediately
      await signOut(auth);

      toast.success(
        "Verification email sent successfully! Please check your inbox and spam folder.",
        { duration: 6000 }
      );

      // Set cooldown
      setCooldownTime(60); // 60 seconds cooldown
      setShowPasswordInput(false);
      setPassword("");
      onSuccess?.();

    } catch (error: any) {
      console.error("Resend verification error:", error.code);
      
      const errorMessages: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Please try again in a few minutes.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/user-disabled': 'This account has been disabled.',
      };
      
      toast.error(errorMessages[error.code] || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {showPasswordInput && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Enter your password to continue:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your account password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleResend();
              }
            }}
          />
        </div>
      )}
      
      <Button
        type="button"
        onClick={handleResend}
        disabled={isResending || (cooldownTime > 0)}
        className="w-full"
        variant="outline"
      >
        {isResending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            Sending Email...
          </>
        ) : cooldownTime > 0 ? (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Wait {cooldownTime}s
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            Resend Verification Email
          </>
        )}
      </Button>
    </div>
  );
}
