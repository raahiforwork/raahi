"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setStatus("error");
      return;
    }

    (async () => {
      try {
        await applyActionCode(auth, oobCode);
        if (auth.currentUser) {
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            emailVerified: true,
            verifiedAt: serverTimestamp(),
          });
        }
        setStatus("success");
        toast.success("Email verified! You can now log in.");
        setTimeout(() => router.push("/login"), 2000);
      } catch (err) {
        setStatus("error");
        toast.error("Invalid or expired verification link.");
      }
    })();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      {status === "loading" && <p>Verifying your email...</p>}
      {status === "success" && <p>Email verified  Redirecting...</p>}
      {status === "error" && <p>Verification failed </p>}
    </div>
  );
}
