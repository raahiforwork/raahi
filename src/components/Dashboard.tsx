"use client";

import * as React from "react";
import {
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  Star,
  Car,
  Calendar,
  Filter,
  ArrowRight,
  Navigation,
  DollarSign,
  Phone,
  MessageCircle,
  Bookmark,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";

// Mock data for available rides
const availableRides = [
  {
    id: 1,
    driver: {
      name: "Priya Sharma",
      avatar: "/placeholder.svg",
      rating: 4.8,
      ridesCompleted: 45,
      verified: true,
    },
    route: {
      from: "Connaught Place",
      to: "Gurgaon Cyber City",
      fromTime: "8:30 AM",
      toTime: "9:15 AM",
      date: "Today",
    },
    price: 120,
    availableSeats: 2,
    totalSeats: 4,
    car: "Maruti Swift",
    preferences: ["No Smoking", "Music OK", "A/C"],
    distance: "24 km",
    duration: "45 min",
  },
  {
    id: 2,
    driver: {
      name: "Rohit Kumar",
      avatar: "/placeholder.svg",
      rating: 4.9,
      ridesCompleted: 67,
      verified: true,
    },
    route: {
      from: "Lajpat Nagar",
      to: "Noida Sector 62",
      fromTime: "9:00 AM",
      toTime: "10:00 AM",
      date: "Tomorrow",
    },
    price: 80,
    availableSeats: 3,
    totalSeats: 4,
    car: "Honda City",
    preferences: ["No Smoking", "Quiet Ride"],
    distance: "18 km",
    duration: "60 min",
  },
  {
    id: 3,
    driver: {
      name: "Aarti Singh",
      avatar: "/placeholder.svg",
      rating: 4.7,
      ridesCompleted: 28,
      verified: true,
    },
    route: {
      from: "Karol Bagh",
      to: "Dwarka",
      fromTime: "7:45 AM",
      toTime: "8:30 AM",
      date: "Today",
    },
    price: 60,
    availableSeats: 1,
    totalSeats: 4,
    car: "Hyundai i20",
    preferences: ["No Smoking", "Music OK", "Pet Friendly"],
    distance: "15 km",
    duration: "45 min",
  },
];

// Mock data for user's rides
const userRides = [
  {
    id: 1,
    type: "upcoming",
    route: {
      from: "Home",
      to: "Office",
      fromTime: "8:30 AM",
      date: "Tomorrow",
    },
    driver: "Priya Sharma",
    status: "confirmed",
    price: 120,
  },
  {
    id: 2,
    type: "completed",
    route: {
      from: "Office",
      to: "Home",
      fromTime: "6:30 PM",
      date: "Yesterday",
    },
    driver: "Vikash Gupta",
    status: "completed",
    price: 100,
    rating: 5,
  },
];

export default function Dashboard() {
  const [searchFrom, setSearchFrom] = React.useState("");
  const [bookingLoading, setBookingLoading] = React.useState<string | null>(
    null,
  );

  // Mock user for testing
  const mockUser = {
    firstName: "Max",
    lastName: "Player",
  };
  const [searchTo, setSearchTo] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState("today");
  const [activeTab, setActiveTab] = React.useState("find-rides");

  // Create ride form state
  const [createRideForm, setCreateRideForm] = React.useState({
    from: "",
    to: "",
    date: "",
    time: "",
    seats: "",
    price: "",
    carModel: "",
    preferences: {
      noSmoking: false,
      musicOk: false,
      petFriendly: false,
      quietRide: false,
    },
  });
  const [isCreatingRide, setIsCreatingRide] = React.useState(false);
  const [createdRides, setCreatedRides] = React.useState<any[]>([]);

  // Combine mock rides with created rides
  const allAvailableRides = React.useMemo(() => {
    return [...availableRides, ...createdRides];
  }, [createdRides]);

  // Handle ride booking
  const handleBookRide = async (ride: any) => {
    setBookingLoading(ride.id);

    // Simulate booking process
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay

      toast.success(
        `Successfully booked ride from ${ride.route.from} to ${ride.route.to}!`,
      );
      toast.info("Chat room will be created when other passengers join.");
    } catch (error) {
      toast.error("Failed to book ride. Please try again.");
    } finally {
      setBookingLoading(null);
    }
  };

  // Handle create ride
  const handleCreateRide = async () => {
    if (
      !createRideForm.from ||
      !createRideForm.to ||
      !createRideForm.date ||
      !createRideForm.time
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreatingRide(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay

      // Create new ride object
      const newRide = {
        id: Date.now(), // Simple ID generation
        driver: {
          name: `${mockUser.firstName} ${mockUser.lastName}`,
          avatar: "/placeholder.svg",
          rating: 4.8, // Default rating for new drivers
          ridesCompleted: 5, // Default number
          verified: true,
        },
        route: {
          from: createRideForm.from,
          to: createRideForm.to,
          fromTime: createRideForm.time,
          toTime: calculateArrivalTime(createRideForm.time),
          date: formatDate(createRideForm.date),
        },
        availableSeats: parseInt(createRideForm.seats) || 3,
        totalSeats: parseInt(createRideForm.seats) || 3,
        price: parseInt(createRideForm.price) || 300,
        car: {
          model: createRideForm.carModel || "Honda City",
          number: "MH 01 AB 1234",
        },
        preferences: getSelectedPreferences(),
        distance: "45 km", // Default distance
        duration: "1h 15m", // Default duration
        features: ["AC", "Music"],
      };

      // Add to created rides
      setCreatedRides((prev) => [newRide, ...prev]);

      toast.success(
        `Ride created successfully from ${createRideForm.from} to ${createRideForm.to}!`,
      );
      toast.info(
        "Your ride is now available for others to book in the Find Rides section.",
      );

      // Reset form
      setCreateRideForm({
        from: "",
        to: "",
        date: "",
        time: "",
        seats: "",
        price: "",
        carModel: "",
        preferences: {
          noSmoking: false,
          musicOk: false,
          petFriendly: false,
          quietRide: false,
        },
      });
    } catch (error) {
      toast.error("Failed to create ride. Please try again.");
    } finally {
      setIsCreatingRide(false);
    }
  };

  // Helper functions
  const calculateArrivalTime = (startTime: string) => {
    if (!startTime) return "9:15 AM";
    const [hours, minutes] = startTime.split(":");
    const startHour = parseInt(hours);
    const arrivalHour = (startHour + 1) % 24; // Add 1 hour
    return `${arrivalHour}:${minutes}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Today";
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const getSelectedPreferences = () => {
    const prefs = [];
    if (createRideForm.preferences.noSmoking) prefs.push("No Smoking");
    if (createRideForm.preferences.musicOk) prefs.push("Music OK");
    if (createRideForm.preferences.petFriendly) prefs.push("Pet Friendly");
    if (createRideForm.preferences.quietRide) prefs.push("Quiet Ride");
    return prefs;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text">Max</span>! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready for your next journey? Find or create a ride below.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:space-x-3 space-y-2 md:space-y-0 text-center md:text-left">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-carpool-100 dark:bg-carpool-900/20 rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5 md:h-6 md:w-6 text-carpool-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">12</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Rides Taken
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:space-x-3 space-y-2 md:space-y-0 text-center md:text-left">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">₹2,400</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Money Saved
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:space-x-3 space-y-2 md:space-y-0 text-center md:text-left">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">4.8</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Rating
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center md:space-x-3 space-y-2 md:space-y-0 text-center md:text-left">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">8</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    This Month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="find-rides" className="text-xs md:text-sm">
              Find Rides
            </TabsTrigger>
            <TabsTrigger value="create-ride" className="text-xs md:text-sm">
              Create Ride
            </TabsTrigger>
            <TabsTrigger value="my-rides" className="text-xs md:text-sm">
              My Rides
            </TabsTrigger>
          </TabsList>

          {/* Find Rides Tab */}
          <TabsContent value="find-rides" className="space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-carpool-600" />
                  <span>Find Your Perfect Ride</span>
                </CardTitle>
                <CardDescription>
                  Search for available rides matching your route and schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">
                      From
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pickup location"
                        value={searchFrom}
                        onChange={(e) => setSearchFrom(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">To</label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Destination"
                        value={searchTo}
                        onChange={(e) => setSearchTo(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium">
                      Date
                    </label>
                    <Select
                      value={selectedDate}
                      onValueChange={setSelectedDate}
                    >
                      <SelectTrigger className="text-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                        <SelectItem value="this-week">This Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium md:opacity-0">
                      Search
                    </label>
                    <Button className="w-full bg-carpool-600 hover:bg-carpool-700 text-sm">
                      <Search className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Search Rides</span>
                      <span className="md:hidden">Search</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <Badge variant="secondary">3 rides found</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Available Rides */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Available Rides ({allAvailableRides.length})
              </h3>
              {allAvailableRides.map((ride) => (
                <Card
                  key={ride.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Driver Info */}
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12">
                          <AvatarImage
                            src={ride.driver.avatar}
                            alt={ride.driver.name}
                          />
                          <AvatarFallback>
                            {ride.driver.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-sm md:text-base truncate">
                              {ride.driver.name}
                            </h4>
                            {ride.driver.verified && (
                              <Badge
                                variant="secondary"
                                className="text-xs flex-shrink-0"
                              >
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{ride.driver.rating}</span>
                            <span>•</span>
                            <span className="hidden md:inline">
                              {ride.driver.ridesCompleted} rides
                            </span>
                            <span className="md:hidden">
                              {ride.driver.ridesCompleted}
                            </span>
                            <span>•</span>
                            <span className="truncate">{ride.car.model}</span>
                          </div>
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 md:space-x-4">
                          <div className="text-center flex-1">
                            <p className="font-medium text-sm md:text-base">
                              {ride.route.fromTime}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                              {ride.route.from}
                            </p>
                          </div>
                          <div className="flex-shrink-0 relative px-2">
                            <div className="h-px bg-border w-8 md:w-16"></div>
                            <Car className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 bg-background text-muted-foreground" />
                          </div>
                          <div className="text-center flex-1">
                            <p className="font-medium text-sm md:text-base">
                              {ride.route.toTime}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                              {ride.route.to}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center space-x-2 md:space-x-4 text-xs text-muted-foreground">
                          <span>{ride.distance}</span>
                          <span>•</span>
                          <span>{ride.duration}</span>
                        </div>
                      </div>

                      {/* Booking Info */}
                      <div className="flex items-center justify-between md:justify-end space-x-4">
                        <div className="text-center md:text-right">
                          <div className="text-xl md:text-2xl font-bold text-carpool-600">
                            ₹{ride.price}
                          </div>
                          <div className="flex items-center justify-center md:justify-end space-x-1 text-xs md:text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>
                              {ride.availableSeats}/{ride.totalSeats} seats
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs md:text-sm"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            <span className="hidden md:inline">Chat</span>
                          </Button>
                          <Button
                            size="sm"
                            className="bg-carpool-600 hover:bg-carpool-700 text-xs md:text-sm"
                            onClick={() => handleBookRide(ride)}
                            disabled={bookingLoading === ride.id}
                          >
                            {bookingLoading === ride.id ? (
                              <span>Booking...</span>
                            ) : (
                              <>
                                <span className="hidden md:inline">
                                  Book Now
                                </span>
                                <span className="md:hidden">Book</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-2">
                        {ride.preferences.map((pref, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Create Ride Tab */}
          <TabsContent value="create-ride" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-carpool-600" />
                  <span>Create a New Ride</span>
                </CardTitle>
                <CardDescription>
                  Share your ride and help others while covering your costs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Route Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm md:text-base">
                      Route Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">From</label>
                        <div className="relative mt-1">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Starting location"
                            className="pl-10"
                            value={createRideForm.from}
                            onChange={(e) =>
                              setCreateRideForm({
                                ...createRideForm,
                                from: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">To</label>
                        <div className="relative mt-1">
                          <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Destination"
                            className="pl-10"
                            value={createRideForm.to}
                            onChange={(e) =>
                              setCreateRideForm({
                                ...createRideForm,
                                to: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Date</label>
                          <Input
                            type="date"
                            className="mt-1"
                            value={createRideForm.date}
                            onChange={(e) =>
                              setCreateRideForm({
                                ...createRideForm,
                                date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Time</label>
                          <Input
                            type="time"
                            className="mt-1"
                            value={createRideForm.time}
                            onChange={(e) =>
                              setCreateRideForm({
                                ...createRideForm,
                                time: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ride Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm md:text-base">
                      Ride Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">
                          Available Seats
                        </label>
                        <Select>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select seats" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 seat</SelectItem>
                            <SelectItem value="2">2 seats</SelectItem>
                            <SelectItem value="3">3 seats</SelectItem>
                            <SelectItem value="4">4 seats</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Price per person
                        </label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="₹ 0"
                            className="pl-10"
                            value={createRideForm.price}
                            onChange={(e) =>
                              setCreateRideForm({
                                ...createRideForm,
                                price: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Car Model</label>
                        <Input
                          placeholder="e.g., Maruti Swift"
                          className="mt-1"
                          value={createRideForm.carModel}
                          onChange={(e) =>
                            setCreateRideForm({
                              ...createRideForm,
                              carModel: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm md:text-base">
                    Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={createRideForm.preferences.noSmoking}
                        onChange={(e) =>
                          setCreateRideForm({
                            ...createRideForm,
                            preferences: {
                              ...createRideForm.preferences,
                              noSmoking: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm">No Smoking</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={createRideForm.preferences.musicOk}
                        onChange={(e) =>
                          setCreateRideForm({
                            ...createRideForm,
                            preferences: {
                              ...createRideForm.preferences,
                              musicOk: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm">Music OK</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={createRideForm.preferences.petFriendly}
                        onChange={(e) =>
                          setCreateRideForm({
                            ...createRideForm,
                            preferences: {
                              ...createRideForm.preferences,
                              petFriendly: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm">Pet Friendly</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={createRideForm.preferences.quietRide}
                        onChange={(e) =>
                          setCreateRideForm({
                            ...createRideForm,
                            preferences: {
                              ...createRideForm.preferences,
                              quietRide: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="text-sm">Quiet Ride</span>
                    </label>
                  </div>
                </div>

                <Button
                  className="w-full bg-carpool-600 hover:bg-carpool-700"
                  size="lg"
                  onClick={handleCreateRide}
                  disabled={isCreatingRide}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreatingRide ? "Creating Ride..." : "Create Ride"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Rides Tab */}
          <TabsContent value="my-rides" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Upcoming Rides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Upcoming Rides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userRides
                    .filter((ride) => ride.type === "upcoming")
                    .map((ride) => (
                      <div
                        key={ride.id}
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-100 text-blue-800">
                            {ride.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {ride.route.date}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {ride.route.from} → {ride.route.to}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {ride.route.fromTime}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="font-medium">₹{ride.price}</span>
                          <div className="space-x-2">
                            <Button variant="outline" size="sm">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Chat
                            </Button>
                            <Button variant="outline" size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Ride History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-green-600" />
                    <span>Ride History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userRides
                    .filter((ride) => ride.type === "completed")
                    .map((ride) => (
                      <div
                        key={ride.id}
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-800">
                            {ride.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {ride.route.date}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {ride.route.from} → {ride.route.to}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {ride.route.fromTime}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="font-medium">₹{ride.price}</span>
                          <div className="flex items-center space-x-2">
                            {ride.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{ride.rating}</span>
                              </div>
                            )}
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
