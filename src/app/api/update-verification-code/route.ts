import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

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
    
    await updateDoc(userDocRef, {
      verificationCode: verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    return NextResponse.json({
      message: "Verification code updated successfully"
    });

  } catch (error: any) {
    console.error("Update code error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
