"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/auth/signin",
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [showBypass, setShowBypass] = useState(false);

  // Show bypass option after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowBypass(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-carpool-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground mb-4">
                Checking authentication...
              </p>
              {showBypass && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Taking too long? You can continue to sign in manually.
                  </p>
                  <Button
                    onClick={() => router.push(redirectTo)}
                    className="w-full"
                  >
                    Continue to Sign In
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to sign in if not authenticated
  if (!user || !userProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please sign in to access this page.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.push(redirectTo)}
                className="w-full"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/auth/signup")}
                className="w-full"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render protected content if authenticated
  return <>{children}</>;
}
