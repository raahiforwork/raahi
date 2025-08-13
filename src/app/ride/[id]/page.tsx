"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Car,
  MessageCircle,
  Calendar,
  Timer,
  UserCheck,
  ArrowRight,
  UserPlus,
  Ban,
  UserX,
  AlertTriangle,
  Crown,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  GoogleMap,
  useLoadScript,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/lib/chatService";
import { Nunito } from "next/font/google";
import InnerNavbar from "@/components/InnerNavbar";
import { toast } from "sonner";
import { Ride } from "@/app/dashboard/page";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });

type Participant = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  status: "confirmed" | "pending";
  userId: string;
};

const extractMainLocation = (address: string) => {
  if (!address) return "";
  const parts = address.split(",").map((part) => part.trim());
  const mainPart =
    parts.find(
      (part) =>
        part.length < 50 &&
        !part.match(/^\d/) &&
        !part.includes("India") &&
        part.length > 3,
    ) || parts[0];
  return mainPart.length > 25 ? mainPart.substring(0, 25) + "..." : mainPart;
};

const RideDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const rideId = params.id as string;

  const [ride, setRide] = useState<Ride | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancellingRide, setCancellingRide] = useState(false);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [leavingRide, setLeavingRide] = useState(false);
  const [userBookingId, setUserBookingId] = useState<string | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [userBookedRides, setUserBookedRides] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const isCreator =
    user?.uid &&
    ride &&
    (user.uid === ride.createdBy || user.uid === ride.userId);
  const isBooked = userBookedRides.includes(rideId);

  const checkIfUserBookedRide = async (rideId: string) => {
    if (!user?.uid) return false;

    try {
      const q = query(
        collection(db, "bookings"),
        where("rideId", "==", rideId),
        where("userId", "==", user.uid),
        where("status", "==", "active"),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUserBookingId(querySnapshot.docs[0].id);
        return true;
      }
      return false;
    } catch (error) {
      
      return false;
    }
  };

  const fetchUserProfile = async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      
    }
  };

  useEffect(() => {
    const fetchRideDetails = async () => {
      if (!rideId) return;

      try {
        const rideDoc = await getDoc(doc(db, "Rides", rideId));
        if (rideDoc.exists()) {
          const rideData = rideDoc.data();

          const ride: Ride = {
            id: rideDoc.id,
            from: rideData.from || "",
            to: rideData.to || "",
            date: rideData.date || "",
            toDate: rideData.toDate || "",
            time: rideData.time || "",
            toTime: rideData.toTime || "",
            totalPrice: rideData.totalPrice || "",
            pricePerSeat: rideData.pricePerSeat || "",
            vehicleType: rideData.vehicleType || "",
            availableSeats: Number(rideData.availableSeats) || 0,
            totalSeats:
              Number(rideData.totalSeats) || Number(rideData.seats) || 0,
            seats: rideData.seats || "0",
            preferences: Array.isArray(rideData.preferences)
              ? rideData.preferences
              : [],
            status: rideData.status || "active",
            createdBy: rideData.createdBy || rideData.userId || "",
            createdByName: rideData.createdByName || "Anonymous",
            createdAt: rideData.createdAt,
            userId: rideData.userId || rideData.createdBy || "",
          };

          setRide(ride);

          const bookingsQuery = query(
            collection(db, "bookings"),
            where("rideId", "==", rideId),
            where("status", "==", "active"),
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);

          const participantsList: Participant[] = bookingsSnapshot.docs.map(
            (doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.userName || "Anonymous",
                email: data.userEmail || "",
                joinedAt:
                  data.bookedAt?.toDate?.().toLocaleDateString() || "Recently",
                status: "confirmed" as const,
                userId: data.userId,
              };
            },
          );

          setParticipants(participantsList);

          if (user?.uid) {
            const userHasBooked = await checkIfUserBookedRide(rideId);
            if (userHasBooked) {
              setUserBookedRides((prev) => [
                ...prev.filter((id) => id !== rideId),
                rideId,
              ]);
            }
          }
        } else {
          
          router.push("/dashboard");
        }
      } catch (error) {
        
        toast.error("Failed to load trip details");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
    fetchUserProfile();
  }, [rideId, router, user?.uid]);

  useEffect(() => {
    if (!ride || !isLoaded || typeof window === "undefined") return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: ride.from,
        destination: ride.to,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        }
      },
    );
  }, [ride, isLoaded]);

  const handleBookRide = async () => {
    if (!user || !ride || !userProfile) {
      toast.error("Please complete your profile first");
      return;
    }

    if (user.uid === ride.createdBy || user.uid === ride.userId) {
      toast.error("You cannot book your own ride!");
      return;
    }

    if (ride.availableSeats <= 0) {
      toast.error("No seats available!");
      return;
    }

    setBookingLoading(true);

    try {
      const alreadyBooked = await checkIfUserBookedRide(ride.id);
      if (alreadyBooked) {
        toast.error("You have already booked this ride!");
        setBookingLoading(false);
        return;
      }

      const bookingData = {
        rideId: ride.id,
        userId: user.uid,
        userEmail: user.email || "",
        userName:
          `${userProfile?.firstName || ""} ${userProfile?.lastName || ""}`.trim() ||
          user.displayName ||
          "Anonymous",
        bookedAt: serverTimestamp(),
        status: "active",
      };

      const bookingDocRef = await addDoc(
        collection(db, "bookings"),
        bookingData,
      );
      setUserBookingId(bookingDocRef.id);

      const updates: any = {
        availableSeats: increment(-1),
      };

      if (ride.availableSeats - 1 <= 0) {
        updates.status = "full";
      }

      await updateDoc(doc(db, "Rides", ride.id), updates);

      try {
        const chatRoomId = await chatService.findChatRoomByRide(ride.id);

        const userDetails = {
          firstName:
            userProfile?.firstName ||
            user.displayName?.split(" ")[0] ||
            "Anonymous",
          lastName:
            userProfile?.lastName || user.displayName?.split(" ")[1] || "",
          email: user.email || "",
          phone: userProfile?.phone || undefined,
        };

        if (chatRoomId && user) {
          await chatService.joinChatRoom(chatRoomId, user.uid, userDetails);
          
        }
      } catch (chatError) {
        
      }

      setUserBookedRides((prev) => [
        ...prev.filter((id) => id !== ride.id),
        ride.id,
      ]);

      setRide((prev) =>
        prev
          ? {
              ...prev,
              availableSeats: prev.availableSeats - 1,
              status: prev.availableSeats - 1 <= 0 ? "full" : prev.status,
            }
          : null,
      );

      setParticipants((prev) => [
        ...prev,
        {
          id: bookingDocRef.id,
          name: bookingData.userName,
          email: bookingData.userEmail,
          joinedAt: new Date().toLocaleDateString(),
          status: "confirmed",
          userId: user.uid,
        },
      ]);

      toast.success(
        "Ride booked successfully! You can now chat with other travelers.",
      );
    } catch (error) {
      
      toast.error("Failed to book ride. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLeaveRide = async () => {
    if (!user?.uid || !ride || !userBookingId) return;
    setLeavingRide(true);

    try {
      const batch = writeBatch(db);

      const rideRef = doc(db, "Rides", ride.id);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        throw new Error("Ride not found");
      }

      const fullRideData = rideDoc.data();

      const bookingRef = doc(db, "bookings", userBookingId);
      batch.delete(bookingRef);

      const rideHistoryRef = doc(
        collection(db, "users", user.uid, "rideHistory"),
      );
      batch.set(rideHistoryRef, {
        ...fullRideData,
        leftAt: serverTimestamp(),
        status: "left",
        reason: "user_left",
      });

      batch.update(rideRef, {
        availableSeats: increment(1),
      });

      await batch.commit();

      try {
        const chatRoomId = await chatService.findChatRoomByRide(ride.id);
        if (chatRoomId) {
          await chatService.leaveChatRoom(chatRoomId, user.uid);
          
        }
      } catch (chatError) {
        
      }

      setUserBookedRides((prev) => prev.filter((id) => id !== ride.id));
      setUserBookingId(null);

      setRide((prev) =>
        prev
          ? {
              ...prev,
              availableSeats: prev.availableSeats + 1,
            }
          : null,
      );

      setParticipants((prev) => prev.filter((p) => p.userId !== user.uid));

      toast.success("You have left the ride successfully.");
    } catch (error) {
      
      toast.error("Failed to leave ride: " + String(error));
    }

    setLeavingRide(false);
  };

  const handleCancelRide = async () => {
    if (!user?.uid || !ride) return;
    setCancellingRide(true);

    try {
      const rideRef = doc(db, "Rides", ride.id);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        throw new Error("Ride not found");
      }

      const fullRideData = rideDoc.data();
      const batch = writeBatch(db);

      batch.delete(rideRef);

      const rideHistoryRef = doc(
        collection(db, "users", user.uid, "rideHistory"),
      );
      batch.set(rideHistoryRef, {
        ...fullRideData,
        cancelledAt: serverTimestamp(),
        status: "cancelled",
        reason: "cancelled_by_creator",
      });

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("rideId", "==", ride.id),
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);

      bookingsSnapshot.docs.forEach((bookingDoc) => {
        batch.delete(bookingDoc.ref);

        const bookingData = bookingDoc.data();
        if (bookingData.userId !== user.uid) {
          const userRideHistoryRef = doc(
            collection(db, "users", bookingData.userId, "rideHistory"),
          );
          batch.set(userRideHistoryRef, {
            ...fullRideData,
            cancelledAt: serverTimestamp(),
            status: "cancelled",
            reason: "cancelled_by_creator",
          });
        }
      });

      await batch.commit();

      try {
        const chatRoomId = await chatService.findChatRoomByRide(ride.id);
        if (chatRoomId) {
          await chatService.permanentlyDeleteChat(chatRoomId);
          
        }
      } catch (chatError) {
        
      }

      toast.success(
        "Ride cancelled successfully. All booked users have been notified.",
      );
      router.push("/dashboard");
    } catch (error) {
      
      toast.error("Failed to cancel ride: " + String(error));
    }

    setCancellingRide(false);
  };

  const handleRemoveUser = async (participant: Participant) => {
    if (!user?.uid || !ride || !isCreator) return;
    setRemovingUser(participant.id);

    try {
      const batch = writeBatch(db);

      const rideRef = doc(db, "Rides", ride.id);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        throw new Error("Ride not found");
      }

      const fullRideData = rideDoc.data();

      const bookingRef = doc(db, "bookings", participant.id);
      batch.delete(bookingRef);

      const userRideHistoryRef = doc(
        collection(db, "users", participant.userId, "rideHistory"),
      );
      batch.set(userRideHistoryRef, {
        ...fullRideData,
        removedAt: serverTimestamp(),
        status: "removed",
        reason: "removed_by_creator",
      });

      batch.update(rideRef, {
        availableSeats: increment(1),
      });

      await batch.commit();

      try {
        const chatRoomId = await chatService.findChatRoomByRide(ride.id);
        if (chatRoomId) {
          await chatService.removeFromChatRoom(chatRoomId, participant.userId);
          
        }
      } catch (chatError) {
        
      }

      setParticipants((prev) => prev.filter((p) => p.id !== participant.id));

      setRide((prev) =>
        prev
          ? {
              ...prev,
              availableSeats: prev.availableSeats + 1,
            }
          : null,
      );

      toast.success(`${participant.name} has been removed from the ride.`);
    } catch (error) {
      
      toast.error("Failed to remove user: " + String(error));
    }

    setRemovingUser(null);
  };

  const formatToAmPm = (time24: string): string => {
    if (!time24) return "";
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 ${nunito.className}`}
      >
        <InnerNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 ${nunito.className}`}
      >
        <InnerNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Trip Not Found
            </h1>
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const availabilityPercentage = (ride.availableSeats / ride.totalSeats) * 100;

  return (
  <div
    className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 ${nunito.className}`}
  >
    {/* Background decorative elements */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />
    <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

    <InnerNavbar />

    <div className="relative z-10 container mx-auto px-4 py-6 sm:py-8 mt-16 sm:mt-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center space-x-3">
          {/* Cancel ride button for creators */}
          {isCreator && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={cancellingRide}
                  className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-500/70 transition-all duration-300"
                >
                  {cancellingRide ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400 mr-2"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel Ride
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700 mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                    Cancel Your Ride
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to cancel this ride? This will:
                    <br />• Remove the ride from the platform
                    <br />• Cancel all bookings for this ride
                    <br />• Notify all booked passengers
                    <br />• This action cannot be undone
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700">
                    Keep Ride
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelRide}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Ride
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Leave ride button for booked users (non-creators) */}
          {isBooked && !isCreator && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={leavingRide}
                  className="border-orange-500/50 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/70 transition-all duration-300"
                >
                  {leavingRide ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400 mr-2"></div>
                      Leaving...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Leave Ride
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700 mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-400" />
                    Leave This Ride?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to leave this ride? This action will
                    free up your seat for other travelers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700">
                    Stay in Ride
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveRide}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Leave Ride
                  </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Book ride button for non-creators */}
          {!isBooked && !isCreator && (
            <Button
              onClick={handleBookRide}
              disabled={bookingLoading || ride.availableSeats <= 0}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300"
            >
              {bookingLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : ride.availableSeats <= 0 ? (
                "Trip Full"
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Book Ride
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}

          {/* Chat button for booked users or creators */}
          {(isBooked || isCreator) && (
            <Button
              onClick={async () => {
                if (!user?.uid) {
                  toast.error("Please log in to access chat");
                  return;
                }

                try {
                  const chatRoomId = await chatService.findChatRoomByRide(
                    ride.id,
                  );

                  if (!chatRoomId) {
                    toast.error("Chat room not found for this ride");
                    return;
                  }

                  const chatRoom = await chatService.getChatRoom(chatRoomId);
                  const isInParticipants = chatRoom?.participants?.includes(
                    user.uid,
                  );
                  const isDeletedForUser = chatRoom?.deletedFor?.includes(
                    user.uid,
                  );

                  const needsToRejoin = !isInParticipants || isDeletedForUser;

                  if (needsToRejoin && userProfile) {
                    const userDetails = {
                      firstName:
                        userProfile?.firstName ||
                        user.displayName?.split(" ")[0] ||
                        "Anonymous",
                      lastName:
                        userProfile?.lastName ||
                        user.displayName?.split(" ")[1] ||
                        "",
                      email: user.email || "",
                      phone: userProfile?.phone || undefined,
                    };

                    await chatService.addUserToChatRoom(
                      chatRoomId,
                      user.uid,
                      userDetails,
                    );
                    toast.success("Rejoined chat successfully!");
                  }

                  router.push("/chat");
                } catch (error) {
                  
                  toast.error("Failed to access chat. Please try again.");
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          )}
        </div>
      </div>

      {/* Rest of your JSX remains exactly the same */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Trip Overview */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 sm:mb-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 break-words leading-tight">
                  {ride.from}
                </h1>
                <div className="text-lg sm:text-xl text-gray-300 mb-4 break-words leading-tight">
                  → {ride.to}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-400 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{ride.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>From {formatToAmPm(ride.time)}</span>
                  </div>
                  {ride.toTime && ride.toTime !== "Unknown" && (
                    <div className="flex items-center">
                      <Timer className="h-4 w-4 mr-1" />
                      <span>
                        Arrives {ride.toTime} | {ride.toDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center sm:text-right flex-shrink-0">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  ₹
                  {ride.vehicleType === "cab"
                    ? ride.totalPrice
                    : ride.pricePerSeat}
                </div>
                <div className="text-sm text-gray-400 mb-2">per person</div>
                {availabilityPercentage <= 25 &&
                availabilityPercentage > 0 ? (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    <Timer className="h-3 w-3 mr-1" />
                    Almost Full
                  </Badge>
                ) : availabilityPercentage === 0 ? (
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    Fully Booked
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Users className="h-3 w-3 mr-1" />
                    Open
                  </Badge>
                )}
              </div>
            </div>

            {/* Route Visual */}
            <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/20 mb-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 bg-green-400 rounded-full mt-1 animate-pulse flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">
                      {formatToAmPm(ride.time)} | {ride.date} | Pickup
                    </div>
                    <div className="text-sm text-gray-300 break-words leading-relaxed">
                      {ride.from}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pl-2">
                  <div className="w-px h-8 bg-gradient-to-b from-green-400 via-blue-400 to-purple-400"></div>
                  <Car className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Travel route</span>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 bg-purple-400 rounded-full mt-1 animate-pulse flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">
                      {ride.toTime !== "Unknown" ? `${ride.toTime} | ` : ""}
                      {ride.toDate} | Drop-off
                    </div>
                    <div className="text-sm text-gray-300 break-words leading-relaxed">
                      {ride.to}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            {ride.preferences && ride.preferences.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Car className="h-5 w-5 mr-2 text-blue-400" />
                  Trip Preferences
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {ride.preferences.map((pref, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-green-500/30 bg-green-500/10 text-green-300 px-3 py-2"
                    >
                      {pref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-4 sm:p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-400" />
              Route Map
            </h3>
            <div className="rounded-xl overflow-hidden border border-gray-700/50 h-64 sm:h-96">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ height: "100%", width: "100%" }}
                  center={{ lat: 28.6139, lng: 77.209 }}
                  zoom={10}
                >
                  {directions && (
                    <DirectionsRenderer directions={directions} />
                  )}
                </GoogleMap>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-800/30">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                    <p className="text-gray-400">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trip Organizer Info - Make Clickable */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-4 sm:p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Trip Organizer
            </h3>

            <div 
              className="flex items-center space-x-4 cursor-pointer hover:bg-green-500/5 p-2 rounded-lg transition-colors"
              onClick={() => router.push(`/profile/${ride.createdBy || ride.userId}`)}
            >
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-4 ring-green-500/30">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg sm:text-xl font-bold">
                  {ride.createdByName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h4 className="text-lg sm:text-xl font-bold text-white truncate hover:text-green-300 transition-colors">
                  {ride.createdByName}
                </h4>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mt-1">
                  <Car className="h-3 w-3 mr-1" />
                  Organizer
                </Badge>
              </div>
            </div>
          </div>

          {/* Participants Info */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-4 sm:p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Travelers ({participants.length + 1}/{ride.totalSeats})
            </h3>

            {/* Trip Organizer - Make clickable */}
            <div 
              className="flex items-center space-x-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20 mb-3 cursor-pointer hover:bg-green-500/15 transition-colors"
              onClick={() => router.push(`/profile/${ride.createdBy || ride.userId}`)}
            >
              <Avatar className="h-10 w-10 ring-2 ring-green-500/30">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-sm">
                  {ride.createdByName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white text-sm truncate hover:text-green-300 transition-colors">
                    {ride.createdByName}
                  </span>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Organizer
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">Trip Creator</p>
              </div>
            </div>

            {/* Participants - Make clickable */}
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-3 cursor-pointer hover:bg-blue-500/15 transition-colors"
                onClick={() => router.push(`/profile/${participant.userId}`)}
              >
                <Avatar className="h-10 w-10 ring-2 ring-blue-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm">
                    {participant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white text-sm truncate hover:text-blue-300 transition-colors">
                      {participant.name}
                    </span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Joined
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Joined {participant.joinedAt}
                  </p>
                </div>

                {/* Remove user button - only for creators */}
                {isCreator && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                          disabled={removingUser === participant.id}
                        >
                          {removingUser === participant.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700 mx-4">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2 text-orange-400" />
                            Remove {participant.name}?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to remove {participant.name}{" "}
                            from this ride? They will be notified of the removal
                            and their seat will become available for others.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveUser(participant)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remove User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}

            {/* Empty seats */}
            {Array.from({ length: ride.availableSeats }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center space-x-3 p-3 bg-gray-700/20 rounded-xl border border-gray-600/20 mb-3"
              >
                <div className="h-10 w-10 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="text-gray-500 text-sm">
                    Available seat
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
export default RideDetailsPage;
