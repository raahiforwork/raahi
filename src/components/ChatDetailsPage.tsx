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
  UserX,
  UserPlus,
  Settings,
  Crown,
  Trash2,
  Plus,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  deleteDoc,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/lib/chatService";
import { Nunito } from "next/font/google";
import InnerNavbar from "@/components/InnerNavbar";
import { toast } from "sonner";
import { Ride } from "@/app/dashboard/page";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });

type ChatParticipant = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  status: "confirmed" | "pending";
  userId: string;
  isOrganizer?: boolean;
};

const ChatDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const rideId = params.id as string;

  const [ride, setRide] = useState<Ride | null>(null);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newMaxParticipants, setNewMaxParticipants] = useState<number>(0);
  const [isEditingSize, setIsEditingSize] = useState(false);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const isOrganizer =
    user?.uid &&
    ride &&
    (user.uid === ride.createdBy || user.uid === ride.userId);

  // Helper function to safely convert timestamp to date string
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Recently";

    try {
      let date: Date;

      if (timestamp && typeof timestamp.toDate === "function") {
        // Firebase Timestamp
        date = timestamp.toDate();
      } else if (timestamp && timestamp.seconds) {
        // Timestamp-like object
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        
        date = timestamp;
      } else if (
        typeof timestamp === "string" ||
        typeof timestamp === "number"
      ) {
        
        date = new Date(timestamp);
      } else {
        return "Recently";
      }

      if (isNaN(date.getTime())) {
        return "Recently";
      }

      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Recently";
    }
  };

  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!rideId) return;

      try {
        // Fetch ride details
        const rideDoc = await getDoc(doc(db, "Rides", rideId));
        if (rideDoc.exists()) {
          const rideData = rideDoc.data();

          const ride: Ride = {
            id: rideDoc.id,
            from: rideData.from || "",
            to: rideData.to || "",
            date: rideData.date || "",
            toDate: rideData.toDate || "Unknown",
            time: rideData.time || "",
            toTime: rideData.toTime || "Unknown", 
            totalPrice: rideData.totalPrice || "",
            pricePerSeat: rideData.pricePerSeat || "",
            vehicleType: rideData.vehicleType || "own",
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
          setNewMaxParticipants(ride.totalSeats);

         
          const bookingsQuery = query(
            collection(db, "bookings"),
            where("rideId", "==", rideId),
            where("status", "==", "active"),
          );
          const bookingsSnapshot = await getDocs(bookingsQuery);

          const participantsList: ChatParticipant[] = [];

         
          participantsList.push({
            id: "organizer",
            name: ride.createdByName,
            email: "", 
            joinedAt: formatTimestamp(ride.createdAt),
            status: "confirmed" as const,
            userId: ride.userId,
            isOrganizer: true,
          });

          // Add other participants
          bookingsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.userId !== ride.createdBy) {
              // Don't duplicate organizer
              participantsList.push({
                id: doc.id,
                name: data.userName || "Anonymous",
                email: data.userEmail || "",
                joinedAt: formatTimestamp(data.bookedAt),
                status: "confirmed" as const,
                userId: data.userId,
                isOrganizer: false,
              });
            }
          });

          setParticipants(participantsList);
        } else {
          console.error("Ride document not found");
          router.push("/chat");
        }
      } catch (error) {
        console.error("Error fetching chat details:", error);
        toast.error("Failed to load chat details");
        router.push("/chat");
      } finally {
        setLoading(false);
      }
    };

    fetchChatDetails();
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

  const handleRemoveParticipant = async (
    participantId: string,
    participantUserId: string,
    participantName: string,
  ) => {
    if (!ride || !isOrganizer) {
      toast.error("You don't have permission to remove participants");
      return;
    }

    if (participantUserId === ride.createdBy) {
      toast.error("Cannot remove the trip organizer");
      return;
    }

    setActionLoading(participantId);

    try {
      // 1. Remove booking document
      await deleteDoc(doc(db, "bookings", participantId));

      // 2. Update ride availability
      await updateDoc(doc(db, "Rides", ride.id), {
        availableSeats: increment(1),
        status: "active", // Set back to active since we have available seats now
      });

      // 3. Remove from chat room
      try {
        const chatRoomId = await chatService.findChatRoomByRide(ride.id);
        if (chatRoomId) {
          await chatService.removeFromChatRoom(chatRoomId, participantUserId);
          console.log("Successfully removed user from chat room");
        }
      } catch (chatError) {
        console.error("Error removing from chat room:", chatError);
      }

      // 4. Update local state
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));

      setRide((prev) =>
        prev
          ? {
              ...prev,
              availableSeats: prev.availableSeats + 1,
              status: "active",
            }
          : null,
      );

      toast.success(`${participantName} has been removed from the chat`);
    } catch (error) {
      console.error("Error removing participant:", error);
      toast.error("Failed to remove participant. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateChatSize = async () => {
    if (!ride || !isOrganizer) {
      toast.error("You don't have permission to update chat size");
      return;
    }

    if (newMaxParticipants < participants.length) {
      toast.error(
        `Cannot set size below current participant count (${participants.length})`,
      );
      return;
    }

    if (newMaxParticipants < 1) {
      toast.error("Chat size must be at least 1");
      return;
    }

    setActionLoading("updateSize");

    try {
      const newAvailableSeats = newMaxParticipants - participants.length;

      await updateDoc(doc(db, "Rides", ride.id), {
        totalSeats: newMaxParticipants,
        seats: newMaxParticipants.toString(),
        availableSeats: newAvailableSeats,
        status: newAvailableSeats > 0 ? "active" : "full",
      });

      setRide((prev) =>
        prev
          ? {
              ...prev,
              totalSeats: newMaxParticipants,
              availableSeats: newAvailableSeats,
              status: newAvailableSeats > 0 ? "active" : "full",
            }
          : null,
      );

      setIsEditingSize(false);
      toast.success(
        `Chat room size updated to ${newMaxParticipants} participants`,
      );
    } catch (error) {
      console.error("Error updating chat size:", error);
      toast.error("Failed to update chat size. Please try again.");
    } finally {
      setActionLoading(null);
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

  // Safe format for toTime that might be undefined
  const formatToTimeDisplay = (toTime: string | undefined): string => {
    if (!toTime || toTime === "Unknown") return "";
    return formatToAmPm(toTime);
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
              Chat Room Not Found
            </h1>
            <Button onClick={() => router.push("/chat")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            onClick={() => router.push("/chat")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => router.push("/chat")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Open Chat
            </Button>

            {isOrganizer && (
              <Dialog open={isEditingSize} onOpenChange={setIsEditingSize}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Chat Room Settings
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                      Adjust the maximum number of participants in this chat
                      room.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="maxParticipants"
                        className="text-sm font-medium text-gray-300"
                      >
                        Maximum Participants
                      </Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        min={participants.length}
                        max={50}
                        value={newMaxParticipants}
                        onChange={(e) =>
                          setNewMaxParticipants(Number(e.target.value))
                        }
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Current: {participants.length} participants. Minimum:{" "}
                        {participants.length}
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingSize(false);
                          setNewMaxParticipants(ride.totalSeats);
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateChatSize}
                        disabled={actionLoading === "updateSize"}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === "updateSize" ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Update Size
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                    Chat: {ride.from}
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
                        <span>Arrives {formatToTimeDisplay(ride.toTime)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center sm:text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {participants.length}/{ride.totalSeats}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">participants</div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat Active
                  </Badge>
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
                        {ride.toTime && ride.toTime !== "Unknown"
                          ? `${formatToTimeDisplay(ride.toTime)} - `
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
            {/* Chat Room Info */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-4 sm:p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-400" />
                Chat Participants ({participants.length}/{ride.totalSeats})
              </h3>

              {/* Participants List */}
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`flex items-center space-x-3 p-3 rounded-xl border ${
                      participant.isOrganizer
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-blue-500/10 border-blue-500/20"
                    }`}
                  >
                    <Avatar
                      className={`h-10 w-10 ring-2 ${
                        participant.isOrganizer
                          ? "ring-green-500/30"
                          : "ring-blue-500/30"
                      }`}
                    >
                      <AvatarFallback
                        className={`font-bold text-sm ${
                          participant.isOrganizer
                            ? "bg-gradient-to-br from-green-500 to-green-600"
                            : "bg-gradient-to-br from-blue-500 to-blue-600"
                        } text-white`}
                      >
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
                        <Badge
                          className={`text-xs ${
                            participant.isOrganizer
                              ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                              : "bg-green-500/20 text-green-300 border-green-500/30"
                          }`}
                        >
                          {participant.isOrganizer ? (
                            <>
                              <Crown className="h-3 w-3 mr-1" />
                              Organizer
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Member
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        {participant.isOrganizer
                          ? "Trip Creator"
                          : `Joined ${participant.joinedAt}`}
                      </p>
                    </div>

                    {/* Remove button for organizer */}
                    {isOrganizer && !participant.isOrganizer && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            disabled={actionLoading === participant.id}
                          >
                            {actionLoading === participant.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center text-red-400">
                              <Trash2 className="h-5 w-5 mr-2" />
                              Remove Participant
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-300">
                              Are you sure you want to remove{" "}
                              <strong>{participant.name}</strong> from this chat
                              room? They will lose access to the chat and their
                              booking will be cancelled.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleRemoveParticipant(
                                  participant.id,
                                  participant.userId,
                                  participant.name,
                                )
                              }
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: ride.availableSeats }, (_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center space-x-3 p-3 bg-gray-700/20 rounded-xl border border-gray-600/20"
                  >
                    <div className="h-10 w-10 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-500 text-sm">
                        Available slot
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDetailsPage;
