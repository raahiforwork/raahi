// app/ride/[id]/page.tsx
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const RideDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const rideId = params.id as string;

  const [ride, setRide] = useState<Ride | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
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
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking booking:", error);
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
      console.error("Error fetching user profile:", error);
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
          console.error("Ride document not found");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching ride details:", error);
        toast.error("Failed to load trip details");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
    fetchUserProfile();
  }, [rideId, router, user?.uid]);

  // Fetch directions when ride data is available
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
      // 1. Check if user has already booked this ride
      const alreadyBooked = await checkIfUserBookedRide(ride.id);
      if (alreadyBooked) {
        toast.error("You have already booked this ride!");
        setBookingLoading(false);
        return;
      }

      // 2. Create booking document
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

      await addDoc(collection(db, "bookings"), bookingData);

      // 3. Update ride availability
      const updates: any = {
        availableSeats: increment(-1),
      };

      if (ride.availableSeats - 1 <= 0) {
        updates.status = "full";
      }

      await updateDoc(doc(db, "Rides", ride.id), updates);

      // 4. Join chat room
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
          console.log("Successfully joined chat room");
        }
      } catch (chatError) {
        console.error("Error joining chat room:", chatError);
      }

      // 5. Update local state
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
          id: Date.now().toString(),
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
      console.error("Error booking ride:", error);
      toast.error("Failed to book ride. Please try again.");
    } finally {
      setBookingLoading(false);
    }
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

            {(isBooked || isCreator) && (
              <Button
                onClick={() => router.push("/chat")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            )}
          </div>
        </div>

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
                        <span>Arrives {ride.toTime}</span>
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
                        {formatToAmPm(ride.time)} - Pickup
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
                        {ride.toTime !== "Unknown"
                          ? `${formatToAmPm(ride.toTime)} - `
                          : ""}
                        Drop-off
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
            {/* Trip Organizer Info */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-4 sm:p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">
                Trip Organizer
              </h3>

              <div className="flex items-center space-x-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-4 ring-green-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg sm:text-xl font-bold">
                    {ride.createdByName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "T"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg sm:text-xl font-bold text-white truncate">
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

              {/* Trip Organizer */}
              <div className="flex items-center space-x-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20 mb-3">
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
                    <span className="font-medium text-white text-sm truncate">
                      {ride.createdByName}
                    </span>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                      <Car className="h-3 w-3 mr-1" />
                      Organizer
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">Trip Creator</p>
                </div>
              </div>

              {/* Participants - No removal buttons */}
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-3"
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
                      <span className="font-medium text-white text-sm truncate">
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
};

export default RideDetailsPage;
