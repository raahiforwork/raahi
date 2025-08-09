"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EnhancedRideCard from "../EnhancedRideCard";
import { Ride } from "@/app/dashboard/page";

interface AvailableRidesListProps {
  rides: Ride[];
  selectedRide: Ride | null;
  onRideSelect: (ride: Ride) => void;
  onBook: (ride: Ride) => void;
  bookingLoading: string | null;
  userBookedRides: string[];
}

const RIDES_PER_PAGE = 6;

const AvailableRidesList: React.FC<AvailableRidesListProps> = ({
  rides,
  selectedRide,
  onRideSelect,
  onBook,
  bookingLoading,
  userBookedRides,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const availableRides = React.useMemo(() => {
    return rides.filter(ride => ride.availableSeats > 0);
  }, [rides]);

  
  const totalPages = Math.ceil(availableRides.length / RIDES_PER_PAGE);
  const startIndex = (currentPage - 1) * RIDES_PER_PAGE;
  const endIndex = startIndex + RIDES_PER_PAGE;
  const currentRides = availableRides.slice(startIndex, endIndex);

  
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (availableRides.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-2xl w-fit mx-auto mb-4 sm:mb-6">
          <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">No Available Trips</h3>
        <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base px-4">
          All trips are currently full or there are no trips matching your criteria. Check back later for new trips.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      <div className="flex items-center justify-between">
        
        {totalPages > 1 && (
          <Badge variant="outline" className="border-gray-600 text-gray-300 text-sm">
            Page {currentPage} of {totalPages}
          </Badge>
        )}
      </div>

  
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {currentRides.map((ride) => (
          <EnhancedRideCard
            key={ride.id}
            ride={ride}
            onBook={onBook}
            bookingLoading={bookingLoading}
            userBookedRides={userBookedRides}
            selectedRide={selectedRide}
            onRideSelect={onRideSelect}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4 sm:pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={
                    currentPage === pageNumber
                      ? "bg-green-600 text-white"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AvailableRidesList;