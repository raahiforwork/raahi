// components/dashboard/EnhancedRideCard.tsx
"use client";

import React from "react";
import {
  Car,
  Users,
  Clock,
  ChevronRight,
  CalendarDays,
  Timer,
  Eye,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Ride } from "@/app/dashboard/page";
import { useRouter } from "next/navigation";

interface EnhancedRideCardProps {
  ride: Ride;
  onBook: (ride: Ride) => void;
  bookingLoading: string | null;
  userBookedRides: string[];
  selectedRide?: Ride | null;
  onRideSelect: (ride: Ride) => void;
}

const formatToAmPm = (time24: string): string => {
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
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

  return mainPart.length > 20 ? mainPart.substring(0, 20) + "..." : mainPart;
};

const EnhancedRideCard: React.FC<EnhancedRideCardProps> = ({
  ride,
  onBook,
  bookingLoading,
  userBookedRides,
  selectedRide,
  onRideSelect,
}) => {
  const router = useRouter();
  const isBooked = userBookedRides.includes(ride.id);
  const isLoading = bookingLoading === ride.id;
  const isSelected = selectedRide?.id === ride.id;
  const availabilityPercentage = (ride.availableSeats / ride.totalSeats) * 100;

  const handleCardClick = () => {
    onRideSelect(ride);
  };

  const handleViewRideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/ride/${ride.id}`);
  };

  const handleJoinTripClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/ride/${ride.id}`);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/ride/${ride.id}`);
  };

  return (
    <div
      className={`group relative bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-2xl overflow-hidden ${
        isSelected
          ? "border-green-500/50 shadow-green-500/20 shadow-xl"
          : "border-gray-700/30 hover:border-gray-600/50"
      }`}
      onClick={handleCardClick}
    >
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
        {availabilityPercentage <= 25 && availabilityPercentage > 0 ? (
          <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs animate-pulse">
            <Timer className="h-3 w-3 mr-1" />
            Almost Full
          </Badge>
        ) : availabilityPercentage === 0 ? (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Full
          </Badge>
        ) : (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
            Open
          </Badge>
        )}
      </div>

      <div className="p-5 sm:p-6 md:p-7 pt-14">
        <div className="flex items-start justify-between mb-5 sm:mb-6 gap-4 min-h-[60px]">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-green-500/30">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-sm">
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
              <p className="text-xs sm:text-sm text-gray-400">Ride</p>
            </div>
          </div>

          <div className="text-right flex-shrink-0 min-w-[80px]">
            <div className="text-xs text-gray-400 whitespace-nowrap mb-1">
              {ride.vehicleType === "cab" ? "Total Price" : "Price Per Seat"}
            </div>

            <div className="text-lg sm:text-xl font-bold text-white">
              {ride.vehicleType === "cab"
                ? `₹${ride.totalPrice}`
                : `₹${ride.pricePerSeat}`}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5 mb-5 sm:mb-6">
          {/* Date and Time Info */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center text-green-400">
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
                {ride.availableSeats}/{ride.totalSeats}
              </span>
            </div>
          </div>

          {/* Route Visual */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-5 border border-gray-700/20">
            <div className="flex items-center">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
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
                  <p className="text-xs text-purple-400">Drop-off</p>
                </div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse flex-shrink-0"></div>
              </div>
            </div>
          </div>
        </div>

        {ride.preferences && ride.preferences.length > 0 && (
          <div className="mb-5 sm:mb-6">
            <div className="flex flex-wrap gap-2">
              {ride.preferences.slice(0, 2).map((pref, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-gray-600/50 bg-gray-700/30 text-gray-300 text-xs px-2 py-1"
                >
                  {pref}
                </Badge>
              ))}
              {ride.preferences.length > 2 && (
                <Badge
                  variant="outline"
                  className="border-gray-600/50 bg-gray-700/30 text-gray-300 text-xs px-2 py-1"
                >
                  +{ride.preferences.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          {isBooked ? (
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-3"
              onClick={handleViewRideClick}
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              View Ride
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300 text-xs sm:text-sm py-3"
              onClick={handleJoinTripClick}
              disabled={ride.availableSeats <= 0}
            >
              {ride.availableSeats <= 0 ? (
                "Trip Full"
              ) : (
                <>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Join Trip
                </>
              )}
            </Button>
          )}

          {/* <Button
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 px-3"
            onClick={handleChevronClick}
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button> */}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default EnhancedRideCard;
