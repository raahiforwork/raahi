"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, RefreshCw } from "lucide-react";

interface ResendVerificationProps {
  email: string;
  onSuccess?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export default function ResendVerification({ 
  email, 
  onSuccess, 
  variant = "default",
  size = "default",
  className = ""
}: ResendVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  
  const COOLDOWN_SECONDS = 180;

  const isValidBennettEmail = (email: string) => {
    return email.toLowerCase().endsWith('@bennett.edu.in');
  };

  const canResend = () => {
    if (!lastSentTime) return true;
    const timeSince = Date.now() - lastSentTime;
    return timeSince >= COOLDOWN_SECONDS * 1000;
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!isValidBennettEmail(email)) {
      toast.error("Please enter a valid Bennett University email address");
      return;
    }

    if (!canResend()) {
      toast.error(`Please wait ${Math.ceil(cooldownRemaining)} seconds before resending`);
      return;
    }

    setIsResending(true);

    try {
      
      const checkResponse = await fetch('/api/check-pending-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        throw new Error(errorData.message || 'Failed to check verification status');
      }

      const verificationData = await checkResponse.json();

    
      const verificationUrl = `${window.location.origin}/verify-email?token=${verificationData.token}&uid=${verificationData.userId}`;

    
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          firstName: verificationData.firstName,
          lastName: verificationData.lastName,
          verificationUrl: verificationUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send verification email');
      }

      setLastSentTime(Date.now());
      toast.success("Verification email sent! Check your inbox and spam folder.");
      
      
      let remaining = COOLDOWN_SECONDS;
      const timer = setInterval(() => {
        remaining--;
        setCooldownRemaining(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          setCooldownRemaining(0);
        }
      }, 1000);

      onSuccess?.();

    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const isDisabled = isResending || !canResend();
  const buttonText = isResending 
    ? "Sending..." 
    : cooldownRemaining > 0 
      ? `Resend (${cooldownRemaining}s)` 
      : "Resend Verification Email";

  return (
    <Button
      onClick={handleResend}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={className}
    >
      {isResending ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Mail className="h-4 w-4 mr-2" />
      )}
      {buttonText}
    </Button>
  );
}
