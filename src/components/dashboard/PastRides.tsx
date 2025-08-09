import { useState } from "react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity, Shield, Car, Users, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Ride } from "@/app/dashboard/page";

type PastRidesProps = {
  pastRides?: Ride[];
  userId: string;
  onDelete?: (id: string) => void;
};

function formatToAmPm(time: string) {
  let [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${suffix}`;
}

export default function PastRides({
  pastRides = [],
  userId,
  onDelete,
}: PastRidesProps) {
  const [rides, setRides] = useState<Ride[]>([...pastRides]);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleDelete(ride: Ride) {
    if (!userId) return;
    setLoading(ride.id);
    try {
      const rideDocRef = doc(db, "users", userId, "rideHistory", ride.id);
      await deleteDoc(rideDocRef);
      setRides((prev) => prev.filter((r) => r.id !== ride.id));
      if (onDelete) onDelete(ride.id);
    } catch (err: any) {
      alert("Failed to delete ride: " + (err?.message ?? String(err)));
    }
    setLoading(null);
  }

  if (!rides.length) {
    return (
      <div className="text-center py-16">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-2xl">
          <Activity className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-4">
          Your Ride History
        </h3>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Track your past journeys and upcoming rides all in one place
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rides.map((ride: Ride) => (
        <div
          key={ride.id}
          className="bg-black rounded-lg border p-6 border-green-800 hover:border-green-600 transition-colors"
        >
          {ride.status === "cancelled" && (
            <div className="flex justify-center mb-3">
              <Badge className="bg-red-600 text-white text-lg px-6 py-2 font-bold shadow-md border-none hover:bg-red-600">
                <span className="flex items-center gap-1">Cancelled</span>
              </Badge>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Driver Info */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 ring-2 ring-carpool-500">
                <AvatarImage src="" alt="avatar" />
                <AvatarFallback className="bg-gradient-to-br from-carpool-500 to-carpool-700 text-white">
                  {ride.createdByName
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-white">
                    {ride.createdByName}
                  </h4>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

            {/* Route Info */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <span>{formatToAmPm(ride.time)}</span>
                <p className="text-sm text-white/70 truncate">{ride.from}</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-carpool-400 rounded-full" />
                  <div className="w-16 h-px bg-gradient-to-r from-carpool-400 to-carpool-600" />
                  <Car className="h-4 w-4 text-carpool-400" />
                  <div className="w-16 h-px bg-gradient-to-r from-carpool-600 to-carpool-400" />
                  <div className="w-2 h-2 bg-carpool-400 rounded-full" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium text-white">{ride.toTime || "—"}</p>
                <p className="text-sm text-white/70 truncate">{ride.to}</p>
              </div>
            </div>

            {/* Booking Info */}
            <div className="flex flex-col items-end space-y-2">
              <div className="text-right">
                <div className="text-right flex-shrink-0 min-w-[80px]">
                  {/* Price Label */}
                  <div className="text-xs text-gray-400 whitespace-nowrap mb-1">
                    {ride.vehicleType === "cab"
                      ? "Total Price"
                      : "Price Per Seat"}
                  </div>

                  {/* Price Display */}
                  <div className="text-lg sm:text-xl font-bold text-white">
                    {ride.vehicleType === "cab"
                      ? `₹${ride.totalPrice}`
                      : `₹${ride.pricePerSeat}`}
                  </div>
                </div>

                <div className="flex items-center text-sm text-white/70">
                  <Users className="h-3 w-3 mr-1" />
                  <span>
                    {ride.availableSeats}/{ride.totalSeats} seats
                  </span>
                </div>
              </div>

              {ride.status !== "cancelled" && (
                <div className="flex items-center justify-end mt-2">
                  <Badge
                    className={
                      ride.status === "completed"
                        ? "bg-green-600/20 text-green-400 border-green-600/30"
                        : "bg-yellow-600/20 text-yellow-400 border-yellow-600/30"
                    }
                  >
                    {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 text-white/70 bg-red-800 hover:text-white hover:bg-red-700"
                onClick={() => handleDelete(ride)}
                disabled={loading === ride.id}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {loading === ride.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>

          {/* Preferences */}
          {ride.preferences?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                {ride.preferences.map((pref: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-white/20 text-white/70"
                  >
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
