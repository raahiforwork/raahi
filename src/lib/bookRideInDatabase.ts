import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";

export const bookRideInDatabase = async (ride: { id: string }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  const rideRef = doc(db, "rides", ride.id);
  const bookingData = {
    userId: user.uid,
    name: user.displayName || "Unnamed",
    email: user.email || "",
    phone: user.phoneNumber || "",
    timestamp: serverTimestamp(),
  };

  await addDoc(collection(rideRef, "bookings"), bookingData);
};
