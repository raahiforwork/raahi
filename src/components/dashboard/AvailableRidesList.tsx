"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Filter,
  SortAsc,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EnhancedRideCard from "../EnhancedRideCard";
import { Ride } from "@/app/dashboard/page";

interface AvailableRidesListProps {
  rides: Ride[];
  selectedRide: Ride | null;
  onRideSelect: (ride: Ride) => void;
  onBook: (ride: Ride) => void;
  bookingLoading: string | null;
  userBookedRides: string[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const RIDES_PER_PAGE = 6;

type SortOption = "date" | "price" | "seats" | "newest";
type FilterOption = "all" | "almostFull" | "available" | "today" | "tomorrow";

const AvailableRidesList: React.FC<AvailableRidesListProps> = ({
  rides,
  selectedRide,
  onRideSelect,
  onBook,
  bookingLoading,
  userBookedRides,
  onRefresh,
  isRefreshing = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const filteredRides = React.useMemo(() => {
    let filtered = rides.filter((ride) => ride.availableSeats > 0);

    switch (filterBy) {
      case "almostFull":
        filtered = filtered.filter((ride) => {
          const availabilityPercentage =
            (ride.availableSeats / ride.totalSeats) * 100;
          return availabilityPercentage <= 25 && availabilityPercentage > 0;
        });
        break;
      case "available":
        filtered = filtered.filter((ride) => {
          const availabilityPercentage =
            (ride.availableSeats / ride.totalSeats) * 100;
          return availabilityPercentage > 25;
        });
        break;
      case "today":
        const today = new Date().toISOString().split("T")[0];
        filtered = filtered.filter((ride) => ride.date === today);
        break;
      case "tomorrow":
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        filtered = filtered.filter((ride) => ride.date === tomorrowStr);
        break;
      default:
        break;
    }

    return filtered;
  }, [rides, filterBy]);

  const sortedRides = React.useMemo(() => {
    const sorted = [...filteredRides];

    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => {
          const dateComparison = a.date.localeCompare(b.date);
          if (dateComparison === 0) {
            return a.time.localeCompare(b.time);
          }
          return dateComparison;
        });
      case "price":
        return sorted.sort((a, b) => {
          const priceA =
            a.vehicleType === "cab" ? a.totalPrice || 0 : a.pricePerSeat || 0;
          const priceB =
            b.vehicleType === "cab" ? b.totalPrice || 0 : b.pricePerSeat || 0;
          return Number(priceA) - Number(priceB);
        });
      case "seats":
        return sorted.sort((a, b) => b.availableSeats - a.availableSeats);
      case "newest":
      default:
        return sorted.sort((a: Ride, b: Ride) => {
          const parseDate = (dateValue: any) => {
            if (!dateValue) return new Date(0);

            if (typeof dateValue === "string") {
              return new Date(dateValue);
            }

            if (dateValue.toDate && typeof dateValue.toDate === "function") {
              return dateValue.toDate();
            }

            if (dateValue.seconds) {
              return new Date(dateValue.seconds * 1000);
            }

            return new Date(0);
          };

          const timeA = parseDate(a.createdAt);
          const timeB = parseDate(b.createdAt);

          return timeB.getTime() - timeA.getTime();
        });
    }
  }, [filteredRides, sortBy]);

  const totalPages = Math.ceil(sortedRides.length / RIDES_PER_PAGE);
  const startIndex = (currentPage - 1) * RIDES_PER_PAGE;
  const endIndex = startIndex + RIDES_PER_PAGE;
  const currentRides = sortedRides.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, filterBy]);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const getFilterInfo = () => {
    switch (filterBy) {
      case "almostFull":
        return { label: "Almost Full", count: filteredRides.length };
      case "available":
        return { label: "Available", count: filteredRides.length };
      case "today":
        return { label: "Today", count: filteredRides.length };
      case "tomorrow":
        return { label: "Tomorrow", count: filteredRides.length };
      default:
        return { label: "All Rides", count: filteredRides.length };
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "date":
        return "Date & Time";
      case "price":
        return "Price (Low to High)";
      case "seats":
        return "Most Seats";
      case "newest":
        return "Recently Added";
      default:
        return "Recently Added";
    }
  };

  if (rides.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-2xl w-fit mx-auto mb-4 sm:mb-6">
          <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">
          No Rides Available
        </h3>
        <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base px-4">
          No rides are currently available. Create a ride or check back later
          for new trips.
        </p>
      </div>
    );
  }

  if (filteredRides.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-sm">
              {getFilterInfo().count} rides found
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {getFilterInfo().label}
                  </span>
                  <span className="sm:hidden">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setFilterBy("all")}
                >
                  All Rides
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setFilterBy("available")}
                >
                  Available
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setFilterBy("almostFull")}
                >
                  Almost Full
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setFilterBy("today")}
                >
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setFilterBy("tomorrow")}
                >
                  Tomorrow
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <SortAsc className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{getSortLabel()}</span>
                  <span className="sm:hidden">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setSortBy("newest")}
                >
                  Recently Added
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setSortBy("date")}
                >
                  Date & Time
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setSortBy("price")}
                >
                  Price (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-300 hover:bg-gray-700"
                  onClick={() => setSortBy("seats")}
                >
                  Most Seats Available
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh Button */}
            {onRefresh && (
              <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="border-green-600/50 text-green-400 hover:bg-green-600/10 hover:border-green-500 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* No results message */}
        <div className="text-center py-8 sm:py-12">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-2xl w-fit mx-auto mb-4 sm:mb-6">
            <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">
            No Trips Match Your Filter
          </h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base px-4">
            Try adjusting your filters or check back later for new trips
            matching your criteria.
          </p>
          <Button
            onClick={() => {
              setFilterBy("all");
              setSortBy("newest");
            }}
            variant="outline"
            className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Clear Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with stats, filters, and controls */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Stats Badge Row */}
        <div className="flex items-center justify-center sm:justify-start">
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-sm">
            {getFilterInfo().count} rides available
          </Badge>
          {totalPages > 1 && (
            <Badge
              variant="outline"
              className="border-gray-600 text-gray-300 text-sm ml-4"
            >
              Page {currentPage} of {totalPages}
            </Badge>
          )}
        </div>

        {/* Controls Row - All buttons in one line */}
        <div className="flex items-center justify-center sm:justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1 sm:flex-initial max-w-[120px] sm:max-w-none"
              >
                <Filter className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">
                  <span className="sm:hidden">Filter</span>
                  <span className="hidden sm:inline">
                    {getFilterInfo().label}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setFilterBy("all")}
              >
                All Rides
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setFilterBy("available")}
              >
                Available
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setFilterBy("almostFull")}
              >
                Almost Full
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setFilterBy("today")}
              >
                Today
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setFilterBy("tomorrow")}
              >
                Tomorrow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1 sm:flex-initial max-w-[120px] sm:max-w-none"
              >
                <SortAsc className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">
                  <span className="sm:hidden">Sort</span>
                  <span className="hidden sm:inline">{getSortLabel()}</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700">
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setSortBy("newest")}
              >
                Recently Added
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setSortBy("date")}
              >
                Date & Time
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setSortBy("price")}
              >
                Price (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700"
                onClick={() => setSortBy("seats")}
              >
                Most Seats Available
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="border-green-600/50 text-green-400 hover:bg-green-600/10 hover:border-green-500 disabled:opacity-50 flex-1 sm:flex-initial max-w-[120px] sm:max-w-none"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="text-xs sm:text-sm">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Rides Grid */}
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
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
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

export default AvailableRidesList; ye available rides ka code hai 
