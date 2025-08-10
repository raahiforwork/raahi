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
  writeBatch,
  serverTimestamp,
  increment,
  addDoc,
  getDoc,
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
  Ban,
  Eye,
} from "lucide-react";
import { chatService } from "@/lib/chatService";
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
import { useRouter } from "next/navigation";

type BookedRide = {
  id: string;
  rideId: string;
  userId: string;
  userName: string;
  userEmail: string;
  bookedAt: any;
  status: "active" | "completed" | "cancelled" | "left";
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
  const [cancellingRide, setCancellingRide] = useState<string | null>(null);
  const router = useRouter();

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

  const handleLeaveRide = async (ride: BookedRide) => {
    if (!userId) return;
    setLoading(ride.id);

    try {
      const batch = writeBatch(db);

      const actualRideId = ride.rideId || ride.id.replace("_created", "");
      const rideRef = doc(db, "Rides", actualRideId);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        throw new Error("Ride not found");
      }

      const fullRideData = rideDoc.data();

      // 1. Delete booking if it exists
      if (!ride.id.includes("_past")) {
        const bookingRef = doc(db, "bookings", ride.id);
        batch.delete(bookingRef);
      }

      // 2. Add to ride history
      const rideHistoryRef = doc(
        collection(db, "users", userId, "rideHistory"),
      );
      batch.set(rideHistoryRef, {
        ...fullRideData,
        leftAt: serverTimestamp(),
        status: "left",
        reason: "user_left",
      });

      // 3. Update ride seats
      batch.update(rideRef, {
        availableSeats: increment(1),
      });

      await batch.commit();

      // 4. Remove user from chat room
      try {
        const chatRoomId = await chatService.findChatRoomByRide(actualRideId);
        if (chatRoomId) {
          await chatService.leaveChatRoom(chatRoomId, userId);
          console.log("Successfully left chat room");
        }
      } catch (chatError) {
        console.error("Error leaving chat room:", chatError);
        // Don't fail the entire operation if chat removal fails
      }

      setRides((prev) => prev.filter((r) => r.id !== ride.id));
      toast.success("You have left the ride successfully.");
    } catch (error) {
      console.error("Error leaving ride:", error);
      toast.error("Failed to leave ride: " + String(error));
    }

    setLoading(null);
  };

  const handleCancelRide = async (ride: BookedRide) => {
    if (!userId) return;
    setCancellingRide(ride.id);

    try {
      const actualRideId = ride.rideId || ride.id.replace("_created", "");
      const rideRef = doc(db, "Rides", actualRideId);
      const rideDoc = await getDoc(rideRef);

      if (!rideDoc.exists()) {
        throw new Error("Ride not found");
      }

      const fullRideData = rideDoc.data();
      const batch = writeBatch(db);

      // 1. Delete the ride
      batch.delete(rideRef);

      // 2. Add to creator's ride history
      const rideHistoryRef = doc(
        collection(db, "users", userId, "rideHistory"),
      );
      batch.set(rideHistoryRef, {
        ...fullRideData,
        cancelledAt: serverTimestamp(),
        status: "cancelled",
        reason: "cancelled_by_creator",
      });

      // 3. Delete all bookings and add to users' histories
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("rideId", "==", actualRideId),
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);

      bookingsSnapshot.docs.forEach((bookingDoc) => {
        batch.delete(bookingDoc.ref);

        const bookingData = bookingDoc.data();
        if (bookingData.userId !== userId) {
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

      // 4. Delete the entire chat room (since ride is cancelled)
      try {
        const chatRoomId = await chatService.findChatRoomByRide(actualRideId);
        if (chatRoomId) {
          await chatService.permanentlyDeleteChat(chatRoomId);
          console.log("Successfully deleted chat room");
        }
      } catch (chatError) {
        console.error("Error deleting chat room:", chatError);
        // Don't fail the entire operation if chat deletion fails
      }

      setRides((prev) => prev.filter((r) => r.id !== ride.id));
      toast.success(
        "Ride cancelled successfully. All booked users have been notified.",
      );
    } catch (error) {
      console.error("Error cancelling ride:", error);
      toast.error("Failed to cancel ride: " + String(error));
    }

    setCancellingRide(null);
  };

  async function handleMarkAsCompleted(ride: BookedRide) {
    if (!userId) return;
    setMarkingCompleted(ride.id);

    try {
      // 1. Update ride/booking status
      if (ride.isCreated && !ride.id.includes("_past")) {
        const actualRideId = ride.id.replace("_created", "");
        await updateDoc(doc(db, "Rides", actualRideId), {
          status: "completed",
        });

        // 2. Creator leaves chat room when marking as completed
        try {
          const chatRoomId = await chatService.findChatRoomByRide(actualRideId);
          if (chatRoomId) {
            await chatService.leaveChatRoom(chatRoomId, userId);
            console.log("Creator successfully left chat room after completion");
          }
        } catch (chatError) {
          console.error("Error leaving chat room:", chatError);
          // Don't fail the entire operation if chat removal fails
        }
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

  async function handleDelete(ride: BookedRide) {
    if (!userId) return;
    setLoading(ride.id);

    try {
      const batch = writeBatch(db);

      if (ride.isCreated && !ride.id.includes("_past")) {
        const actualRideId = ride.id.replace("_created", "");
        const rideRef = doc(db, "Rides", actualRideId);
        batch.delete(rideRef);
      } else if (!ride.id.includes("_past")) {
        const bookingRef = doc(db, "bookings", ride.id);
        batch.delete(bookingRef);
      }

      const actualRideId =
        ride.rideId || ride.id.replace(/_created|_past/g, "");
      const rideHistoryRef = doc(
        db,
        "users",
        userId,
        "rideHistory",
        actualRideId,
      );
      batch.delete(rideHistoryRef);

      await batch.commit();

      setRides((prev) => prev.filter((r) => r.id !== ride.id));
      if (onDelete) onDelete(ride.id);
      toast.success("Trip removed from history");
    } catch (err: any) {
      console.error("Error deleting ride:", err);
      toast.error("Failed to delete trip: " + (err?.message ?? String(err)));
    }
    setLoading(null);
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
      case "left":
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Left
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
    (ride) =>
      ride.status === "completed" ||
      ride.status === "cancelled" ||
      ride.status === "left",
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
                onLeaveRide={handleLeaveRide}
                onCancelRide={handleCancelRide}
                onMarkAsCompleted={handleMarkAsCompleted}
                loading={loading}
                cancellingRide={cancellingRide}
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
                onLeaveRide={handleLeaveRide}
                onCancelRide={handleCancelRide}
                onMarkAsCompleted={handleMarkAsCompleted}
                loading={loading}
                cancellingRide={cancellingRide}
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
  onLeaveRide,
  onCancelRide,
  onMarkAsCompleted,
  loading,
  cancellingRide,
  markingCompleted,
  isActive,
}: {
  ride: BookedRide;
  onDelete: (ride: BookedRide) => void;
  onLeaveRide: (ride: BookedRide) => void;
  onCancelRide: (ride: BookedRide) => void;
  onMarkAsCompleted: (ride: BookedRide) => void;
  loading: string | null;
  cancellingRide: string | null;
  markingCompleted: string | null;
  isActive: boolean;
}) {
  const router = useRouter();
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
      case "left":
        return (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Left
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

        <div className="flex items-center justify-center sm:justify-end w-full">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
            {/* Cancel Ride Button (Creators only) */}
            {ride.isCreated && isActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-500/70 transition-all duration-300 min-w-[60px] h-7 text-[10px] px-2 py-1 whitespace-nowrap"
                    disabled={cancellingRide === ride.id}
                  >
                    {cancellingRide === ride.id ? (
                      <>
                        <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-red-400 mr-1"></div>
                        <span className="hidden xs:inline">Cancelling...</span>
                        <span className="xs:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Ban className="h-2.5 w-2.5 mr-1" />
                        <span className="hidden xs:inline">Cancel</span>
                        <span className="xs:hidden">Cancel</span>
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
                      onClick={() => onCancelRide(ride)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel Ride
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Leave Ride Button (Non-creators only) */}
            {!ride.isCreated && isActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-500/50 text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/70 transition-all duration-300 min-w-[60px] h-7 text-[10px] px-2 py-1 whitespace-nowrap"
                    disabled={loading === ride.id}
                  >
                    {loading === ride.id ? (
                      <>
                        <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-orange-400 mr-1"></div>
                        <span className="hidden xs:inline">Leaving...</span>
                        <span className="xs:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-2.5 w-2.5 mr-1" />
                        <span className="hidden xs:inline">Leave</span>
                        <span className="xs:hidden">Leave</span>
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
                      onClick={() => onLeaveRide(ride)}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Leave Ride
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Mark Complete Button */}
            {isActive && (
              <Button
                size="sm"
                variant="outline"
                className="border-green-500/50 text-green-300 hover:bg-green-500/10 hover:border-green-500/70 transition-all duration-300 min-w-[60px] h-7 text-[10px] px-2 py-1 whitespace-nowrap"
                onClick={() => onMarkAsCompleted(ride)}
                disabled={markingCompleted === ride.id}
              >
                {markingCompleted === ride.id ? (
                  <>
                    <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-green-400 mr-1"></div>
                    <span className="hidden xs:inline">Marking...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-2.5 w-2.5 mr-1" />
                    <span className="hidden xs:inline">Complete</span>
                    <span className="xs:hidden">Done</span>
                  </>
                )}
              </Button>
            )}

            {/* View Details Button */}
            {isActive && (
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/70 transition-all duration-300 min-w-[60px] h-7 text-[10px] px-2 py-1 whitespace-nowrap"
                onClick={() => {
                  const actualRideId =
                    ride.rideId || ride.id.replace(/_created|_past/g, "");
                  router.push(`/ride/${actualRideId}`);
                }}
              >
                <Eye className="h-2.5 w-2.5 mr-1" />
                <span className="hidden xs:inline">Details</span>
                <span className="xs:hidden">View</span>
              </Button>
            )}

            {/* Delete Button */}
            {(!isActive || ride.id.includes("_past")) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-500/70 transition-all duration-300 min-w-[60px] h-7 text-[10px] px-2 py-1 whitespace-nowrap"
                    disabled={loading === ride.id}
                  >
                    {loading === ride.id ? (
                      <>
                        <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-red-400 mr-1"></div>
                        <span className="hidden xs:inline">Deleting...</span>
                        <span className="xs:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-2.5 w-2.5 mr-1" />
                        <span className="hidden xs:inline">Delete</span>
                        <span className="xs:hidden">Del</span>
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
                      Are you sure you want to delete this trip from your
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
            )}
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
