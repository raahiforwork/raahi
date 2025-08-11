import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const pendingRef = collection(db, "pendingVerifications");
    const q = query(pendingRef, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { message: "No pending verification found for this email" },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return NextResponse.json({
      token: data.token,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    });

  } catch (error: any) {
    console.error("Check pending verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
