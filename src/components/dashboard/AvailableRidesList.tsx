"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Car, MessageCircle, Shield, Star, Users } from "lucide-react";
import React from "react";

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  toTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  createdByName: string;
  preferences: string[];
  status: string;
  userId: string;
}

interface AvailableRidesListProps {
  rides: Ride[];
  selectedRide: Ride | null;
  onRideSelect: (ride: Ride) => void;
  onBook: (ride: Ride) => void;
  bookingLoading: string | null;
  userBookedRides: string[];
}

export default function AvailableRidesList({
  rides,
  selectedRide,
  onRideSelect,
  onBook,
  bookingLoading,
}: AvailableRidesListProps) {
  const formatToAmPm = (time24: string): string => {
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white flex items-center">
        <Shield className="h-5 w-5 mr-2 text-carpool-400" />
        Available Rides ({rides.length})
      </h3>

      <div className="grid gap-4">
        {rides.map((ride) => (
          <div
            key={ride.id}
            className={`bg-black rounded-lg border p-6 hover:border-green-600 transition-colors cursor-pointer ${
              selectedRide?.id === ride.id
                ? "border-green-500 ring-2 ring-green-500/20"
                : "border-green-800"
            }`}
            onClick={() => onRideSelect(ride)}
          >
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Driver Info */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 ring-2 ring-carpool-500">
                  <AvatarImage src="" alt="avatar" />
                  <AvatarFallback className="bg-gradient-to-br from-carpool-500 to-carpool-700 text-white">
                    {ride.createdByName
                      ?.split(" ")
                      .map((n) => n[0])
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
                  <div className="text-2xl font-bold text-white">
                    ₹{ride.price}
                  </div>
                  <div className="flex items-center text-sm text-white/70">
                    <Users className="h-3 w-3 mr-1" />
                    <span>
                      {ride.availableSeats}/{ride.totalSeats} seats
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-carpool-500 to-carpool-700 hover:from-carpool-600 hover:to-carpool-800 text-white"
                    onClick={() => onBook(ride)}
                    disabled={bookingLoading === ride.id}
                  >
                    {bookingLoading === ride.id ? "Booking..." : "Book Now"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Preferences */}
            {ride.preferences?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-2">
                  {ride.preferences.map((pref, index) => (
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
    </div>
  );
}
