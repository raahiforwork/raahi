"use client";

import { useState, useEffect } from "react";
import {
  doc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Activity,
  Car,
  Users,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
  AlertTriangle,
  MessageCircle,
  Edit,
  Crown,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
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
import { Ride } from "@/app/dashboard/page";
import { toast } from "sonner";

type BookedRide = {
  id: string;
  rideId: string;
  userId: string;
  userName: string;
  userEmail: string;
  bookedAt: any;
  status: "active" | "completed" | "cancelled";
  from: string;
  to: string;
  date: string;
  time: string;
  toTime?: string;
  pricePerSeat?: number;
  totalPrice?: number;
  vehicleType: "cab" | "own";
  totalSeats: number;
  availableSeats: number;
  createdByName: string;
  preferences?: string[];
  isCreated?: boolean; 
};

type PastRidesProps = {
  pastRides?: Ride[];
  userId: string;
  onDelete?: (id: string) => void;
};

function formatToAmPm(time: string) {
  if (!time) return "";
  let [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${suffix}`;
}

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

export default function PastRides({
  pastRides = [],
  userId,
  onDelete,
}: PastRidesProps) {
  const [rides, setRides] = useState<BookedRide[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [markingCompleted, setMarkingCompleted] = useState<string | null>(null);
  const [fetchingRides, setFetchingRides] = useState(false);

  useEffect(() => {
    const fetchUserRides = async () => {
      if (!userId) {
        const convertedRides: BookedRide[] = pastRides.map((ride) => ({
          id: ride.id,
          rideId: ride.id,
          userId: userId || "",
          userName: ride.createdByName,
          userEmail: "",
          bookedAt: null,
          status:
            (ride.status as "active" | "completed" | "cancelled") ||
            "completed",
          from: ride.from,
          to: ride.to,
          date: ride.date,
          time: ride.time,
          toTime: ride.toTime,
          pricePerSeat: ride.pricePerSeat,
          totalPrice: ride.totalPrice,
          vehicleType: ride.vehicleType,
          totalSeats: ride.totalSeats,
          availableSeats: ride.availableSeats,
          createdByName: ride.createdByName,
          preferences: ride.preferences,
          isCreated: false,
        }));
        setRides(convertedRides);
        return;
      }

      if (pastRides.length === 0) {
        setFetchingRides(true);
      }

      try {
      
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("userId", "==", userId),
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);

        const bookedRidePromises = bookingsSnapshot.docs.map(
          async (bookingDoc) => {
            const bookingData = bookingDoc.data();

            const rideQuery = query(
              collection(db, "Rides"),
              where("__name__", "==", bookingData.rideId),
            );
            const rideSnapshot = await getDocs(rideQuery);

            if (!rideSnapshot.empty) {
              const rideData = rideSnapshot.docs[0].data();

              return {
                id: bookingDoc.id,
                rideId: bookingData.rideId,
                userId: bookingData.userId,
                userName: bookingData.userName,
                userEmail: bookingData.userEmail,
                bookedAt: bookingData.bookedAt,
                status: bookingData.status || "active",
                from: rideData.from,
                to: rideData.to,
                date: rideData.date,
                time: rideData.time,
                toTime: rideData.toTime,
                pricePerSeat: rideData.pricePerSeat,
                totalPrice: rideData.totalPrice,
                vehicleType: rideData.vehicleType,
                totalSeats: rideData.totalSeats,
                availableSeats: rideData.availableSeats,
                createdByName: rideData.createdByName,
                preferences: rideData.preferences,
                isCreated: false, 
              } as BookedRide;
            }
            return null;
          },
        );


        const createdRidesQuery = query(
          collection(db, "Rides"),
          where("userId", "==", userId),
        );
        const createdRidesSnapshot = await getDocs(createdRidesQuery);

        const createdRides: BookedRide[] = createdRidesSnapshot.docs.map(
          (doc) => {
            const rideData = doc.data();
            return {
              id: doc.id + "_created", 
              rideId: doc.id,
              userId: userId,
              userName: rideData.createdByName,
              userEmail: "",
              bookedAt: rideData.createdAt,
              status: rideData.status || "active",
              from: rideData.from,
              to: rideData.to,
              date: rideData.date,
              time: rideData.time,
              toTime: rideData.toTime,
              pricePerSeat: rideData.pricePerSeat,
              totalPrice: rideData.totalPrice,
              vehicleType: rideData.vehicleType,
              totalSeats: rideData.totalSeats,
              availableSeats: rideData.availableSeats,
              createdByName: rideData.createdByName,
              preferences: rideData.preferences,
              isCreated: true,
            };
          },
        );

        const resolvedBookedRides = await Promise.all(bookedRidePromises);
        const validBookedRides = resolvedBookedRides.filter(
          (ride) => ride !== null,
        ) as BookedRide[];

      
        const allRides = [
          ...validBookedRides,
          ...createdRides,
          ...pastRides.map(
            (ride) =>
              ({
                id: ride.id + "_past",
                rideId: ride.id,
                userId: userId,
                userName: ride.createdByName,
                userEmail: "",
                bookedAt: null,
                status:
                  (ride.status as "active" | "completed" | "cancelled") ||
                  "completed",
                from: ride.from,
                to: ride.to,
                date: ride.date,
                time: ride.time,
                toTime: ride.toTime,
                pricePerSeat: ride.pricePerSeat,
                totalPrice: ride.totalPrice,
                vehicleType: ride.vehicleType,
                totalSeats: ride.totalSeats,
                availableSeats: ride.availableSeats,
                createdByName: ride.createdByName,
                preferences: ride.preferences,
                isCreated: false,
              }) as BookedRide,
          ),
        ];

        allRides.sort((a, b) => {
          const dateA = a.bookedAt?.toDate?.() || new Date();
          const dateB = b.bookedAt?.toDate?.() || new Date();
          return dateB.getTime() - dateA.getTime();
        });

        setRides(allRides);
      } catch (error) {
        console.error("Error fetching user rides:", error);
        const convertedRides: BookedRide[] = pastRides.map((ride) => ({
          id: ride.id,
          rideId: ride.id,
          userId: userId,
          userName: ride.createdByName,
          userEmail: "",
          bookedAt: null,
          status:
            (ride.status as "active" | "completed" | "cancelled") ||
            "completed",
          from: ride.from,
          to: ride.to,
          date: ride.date,
          time: ride.time,
          toTime: ride.toTime,
          pricePerSeat: ride.pricePerSeat,
          totalPrice: ride.totalPrice,
          vehicleType: ride.vehicleType,
          totalSeats: ride.totalSeats,
          availableSeats: ride.availableSeats,
          createdByName: ride.createdByName,
          preferences: ride.preferences,
          isCreated: false,
        }));
        setRides(convertedRides);
        toast.error("Failed to load recent rides, showing ride history");
      } finally {
        setFetchingRides(false);
      }
    };

    fetchUserRides();
  }, [userId, pastRides]);

  async function handleDelete(ride: BookedRide) {
    if (!userId) return;
    setLoading(ride.id);

    try {
      if (ride.isCreated && !ride.id.includes("_past")) {
      
        const actualRideId = ride.id.replace("_created", "");
        await deleteDoc(doc(db, "Rides", actualRideId));
      } else if (!ride.id.includes("_past")) {
        // Delete booking
        await deleteDoc(doc(db, "bookings", ride.id));
      }

      setRides((prev) => prev.filter((r) => r.id !== ride.id));
      if (onDelete) onDelete(ride.id);
      toast.success("Trip removed from history");
    } catch (err: any) {
      console.error("Error deleting ride:", err);
      toast.error("Failed to delete trip: " + (err?.message ?? String(err)));
    }
    setLoading(null);
  }

  async function handleMarkAsCompleted(ride: BookedRide) {
    if (!userId) return;
    setMarkingCompleted(ride.id);

    try {
      if (ride.isCreated && !ride.id.includes("_past")) {
   
        const actualRideId = ride.id.replace("_created", "");
        await updateDoc(doc(db, "Rides", actualRideId), {
          status: "completed",
        });
      } else if (!ride.id.includes("_past")) {
        
        await updateDoc(doc(db, "bookings", ride.id), {
          status: "completed",
        });
      }

      setRides((prev) =>
        prev.map((r) =>
          r.id === ride.id ? { ...r, status: "completed" as const } : r,
        ),
      );

      toast.success("Trip marked as completed");
    } catch (err: any) {
      console.error("Error marking as completed:", err);
      toast.error(
        "Failed to mark as completed: " + (err?.message ?? String(err)),
      );
    }
    setMarkingCompleted(null);
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
            <Timer className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  if (fetchingRides) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-400">Loading your trips...</span>
      </div>
    );
  }

  if (!rides.length) {
    return (
      <div className="text-center py-12">
        <div className="p-6 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-2xl w-fit mx-auto mb-6">
          <Activity className="h-16 w-16 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">
          No Trip History
        </h3>
        <p className="text-gray-400 max-w-md mx-auto text-sm px-4">
          Your created and booked trips (active, completed, and cancelled) will
          appear here for easy tracking.
        </p>
      </div>
    );
  }

  const activeRides = rides.filter((ride) => ride.status === "active");
  const completedRides = rides.filter(
    (ride) => ride.status === "completed" || ride.status === "cancelled",
  );
  const createdRides = rides.filter((ride) => ride.isCreated);
  const bookedRides = rides.filter((ride) => !ride.isCreated);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-sm">
            {rides.length} total trips
          </Badge>
          {activeRides.length > 0 && (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-sm">
              {activeRides.length} active
            </Badge>
          )}
          {createdRides.length > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-sm">
              {createdRides.length} created
            </Badge>
          )}
          {completedRides.length > 0 && (
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-sm">
              {completedRides.length} completed
            </Badge>
          )}
        </div>
      </div>

      {/* Active Rides Section */}
      {activeRides.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Timer className="h-5 w-5 mr-2 text-blue-400" />
            Active Trips ({activeRides.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-8">
            {activeRides.map((ride) => (
              <TripCard
                key={ride.id}
                ride={ride}
                onDelete={handleDelete}
                onMarkAsCompleted={handleMarkAsCompleted}
                loading={loading}
                markingCompleted={markingCompleted}
                isActive={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed/Cancelled Rides Section */}
      {completedRides.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
            Past Trips ({completedRides.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {completedRides.map((ride) => (
              <TripCard
                key={ride.id}
                ride={ride}
                onDelete={handleDelete}
                onMarkAsCompleted={handleMarkAsCompleted}
                loading={loading}
                markingCompleted={markingCompleted}
                isActive={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TripCard({
  ride,
  onDelete,
  onMarkAsCompleted,
  loading,
  markingCompleted,
  isActive,
}: {
  ride: BookedRide;
  onDelete: (ride: BookedRide) => void;
  onMarkAsCompleted: (ride: BookedRide) => void;
  loading: string | null;
  markingCompleted: string | null;
  isActive: boolean;
}) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
            <Timer className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  return (
    <div className="group relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2">
        {getStatusBadge(ride.status)}

        {ride.isCreated && (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs flex items-center">
            <Crown className="h-3 w-3 mr-1" />
            Creator
          </Badge>
        )}
      </div>

      <div className="p-5 sm:p-6 md:p-7 pt-14">
        {/* Creator Info and Price */}
        <div className="flex items-start justify-between mb-5 sm:mb-6 gap-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar
                className={`h-12 w-12 sm:h-14 sm:w-14 ring-2 ${isActive ? "ring-blue-500/30" : "ring-purple-500/30"}`}
              >
                <AvatarFallback
                  className={`bg-gradient-to-br ${isActive ? "from-blue-500 to-blue-600" : "from-purple-500 to-purple-600"} text-white font-bold text-sm`}
                >
                  {ride.createdByName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "T"}
                </AvatarFallback>
              </Avatar>
              
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-white text-sm sm:text-base leading-relaxed">
                {ride.createdByName || "Anonymous Traveler"}
              </h4>
              <p className="text-xs sm:text-sm text-gray-400">
                {ride.isCreated ? "You (Trip Organizer)" : "Trip Organizer"}
              </p>
            </div>
          </div>

          {/* Price Display */}
          <div className="text-right flex-shrink-0 min-w-[80px]">
            <div className="text-xs text-gray-400 whitespace-nowrap mb-1">
              {ride.vehicleType === "cab" ? "Total Price" : "Price Per Seat"}
            </div>

            <div className="text-lg sm:text-xl font-bold text-white">
              {ride.vehicleType === "cab"
                ? `₹${ride.totalPrice || 0}`
                : `₹${ride.pricePerSeat || 0}`}
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-4 sm:space-y-5 mb-5 sm:mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div
                className={`flex items-center ${isActive ? "text-blue-400" : "text-purple-400"}`}
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="truncate">{ride.date}</span>
              </div>
              <div className="flex items-center text-blue-400">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span>{formatToAmPm(ride.time)}</span>
              </div>
            </div>
            <div className="flex items-center text-gray-400 flex-shrink-0">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>
                {ride.availableSeats || 0}/{ride.totalSeats}
              </span>
            </div>
          </div>

          {/* Route Visual */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-5 border border-gray-700/20">
            <div className="flex items-center">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-white text-xs sm:text-sm truncate"
                    title={ride.from}
                  >
                    {extractMainLocation(ride.from)}
                  </p>
                  <p className="text-xs text-green-400">Pickup</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 px-4 flex-shrink-0">
                <div className="h-px bg-gradient-to-r from-green-400 to-blue-400 w-8 sm:w-10"></div>
                <Car className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <div className="h-px bg-gradient-to-r from-blue-400 to-purple-400 w-8 sm:w-10"></div>
              </div>

              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0 text-right">
                  <p
                    className="font-medium text-white text-xs sm:text-sm truncate"
                    title={ride.to}
                  >
                    {extractMainLocation(ride.to)}
                  </p>
                  <p className="text-xs text-purple-400">
                    {ride.toTime && ride.toTime !== "Unknown"
                      ? formatToAmPm(ride.toTime)
                      : "Drop-off"}
                  </p>
                </div>
                <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        {ride.preferences && ride.preferences.length > 0 && (
          <div className="mb-5 sm:mb-6">
            <div className="flex flex-wrap gap-2">
              {ride.preferences.slice(0, 3).map((pref, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-gray-600/50 bg-gray-700/30 text-gray-300 text-xs px-2 py-1"
                >
                  {pref}
                </Badge>
              ))}
              {ride.preferences.length > 3 && (
                <Badge
                  variant="outline"
                  className="border-gray-600/50 bg-gray-700/30 text-gray-300 text-xs px-2 py-1"
                >
                  +{ride.preferences.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end w-full">
         
          <div className="flex items-center space-x-2">
            
            {ride.isCreated && isActive && (
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/70 transition-all duration-300"
                onClick={() => {
                  toast.info("Edit functionality coming soon!");
                }}
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Edit
              </Button>
            )}

            {isActive && (
              <Button
                size="sm"
                variant="outline"
                className="border-green-500/50 text-green-300 hover:bg-green-500/10 hover:border-green-500/70 transition-all duration-300"
                onClick={() => onMarkAsCompleted(ride)}
                disabled={markingCompleted === ride.id}
              >
                {markingCompleted === ride.id ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400 mr-2"></div>
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Complete
                  </>
                )}
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-500/70 transition-all duration-300"
                  disabled={loading === ride.id}
                >
                  {loading === ride.id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-400 mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700 mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                    Delete Trip Record
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to delete this{" "}
                    {ride.isCreated ? "created trip" : "booking"} from your
                    history? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(ride)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${isActive ? "from-blue-500/5 to-purple-500/5" : "from-purple-500/5 to-blue-500/5"} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      ></div>
    </div>
  );
}
