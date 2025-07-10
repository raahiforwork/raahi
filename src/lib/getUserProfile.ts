// lib/getUserProfile.ts
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export async function getUserProfile() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No user is logged in");
  }

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      firstName: data.firstName,
      lastName: data.lastName,
    };
  } else {
    throw new Error("User profile not found in Firestore");
  }
}
