import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId, verificationCode } = await request.json();

    if (!userId || !verificationCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

   
    if (userData.verificationCode !== verificationCode) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if code has expired
    const now = new Date();
    const expiry = userData.verificationCodeExpiry?.toDate();
    
    if (expiry && now > expiry) {
      return NextResponse.json(
        { message: "Verification code has expired" },
        { status: 400 }
      );
    }

    // Update user as verified
    await updateDoc(userDocRef, {
      isVerified: true,
      emailVerified: true,
      verificationCode: null, // Clear the code
      verificationCodeExpiry: null,
      verifiedAt: serverTimestamp(),
    });

    return NextResponse.json({
      message: "Email verified successfully",
      verified: true
    });

  } catch (error: any) {
    
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
