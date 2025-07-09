"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  GoogleMap,
  useLoadScript,
  DirectionsRenderer,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { Loader } from "@googlemaps/js-api-loader";
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
  MessageCircle,
  Shield,
  Award,
  Target,
  Activity,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FloatingButton } from "@/components/ui/floating-button";
import { toast } from "sonner";
import InnerNavbar from "@/components/InnerNavbar";
import { Nunito } from "next/font/google";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  addDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const libraries = ["places"];
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });

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
    availableSeats: 2,
    totalSeats: 4,
    price: 180,
    car: {
      model: "Honda City",
      number: "DL 01 AB 1234",
    },
    preferences: ["No Smoking", "Music OK"],
    distance: "28 km",
    duration: "45 min",
    features: ["AC", "WiFi"],
  },
  {
    id: 2,
    driver: {
      name: "Raj Malhotra",
      avatar: "/placeholder.svg",
      rating: 4.6,
      ridesCompleted: 32,
      verified: true,
    },
    route: {
      from: "Karol Bagh",
      to: "Noida Sector 62",
      fromTime: "9:00 AM",
      toTime: "10:00 AM",
      date: "Today",
    },
    availableSeats: 3,
    totalSeats: 4,
    price: 220,
    car: {
      model: "Maruti Swift",
      number: "DL 02 CD 5678",
    },
    preferences: ["Pet Friendly", "Quiet Ride"],
    distance: "35 km",
    duration: "1h 0m",
    features: ["AC", "Music"],
  },
  {
    id: 3,
    driver: {
      name: "Sneha Kapoor",
      avatar: "/placeholder.svg",
      rating: 4.9,
      ridesCompleted: 78,
      verified: true,
    },
    route: {
      from: "Dwarka",
      to: "Gurgaon DLF Phase 1",
      fromTime: "7:45 AM",
      toTime: "8:45 AM",
      date: "Tomorrow",
    },
    availableSeats: 1,
    totalSeats: 4,
    price: 250,
    car: {
      model: "Toyota Innova",
      number: "DL 03 EF 9012",
    },
    preferences: ["No Smoking", "Music OK", "Pet Friendly"],
    distance: "42 km",
    duration: "1h 0m",
    features: ["AC", "WiFi", "USB Charging"],
  },
];

type LatLng = {
  lat: number;
  lng: number;
};

const predefinedLocations: Record<string, LatLng> = {
  "Connaught Place": { lat: 28.6315, lng: 77.2167 },
  "Gurgaon Cyber City": { lat: 28.4946, lng: 77.0886 },
  "Karol Bagh": { lat: 28.6517, lng: 77.1907 },
  "Noida Sector 62": { lat: 28.6304, lng: 77.3735 },
  Dwarka: { lat: 28.5921, lng: 77.046 },
  "Gurgaon DLF Phase 1": { lat: 28.4799, lng: 77.0802 },
};

export async function geocodeAddress(address: string): Promise<LatLng> {
  if (predefinedLocations[address]) return predefinedLocations[address];

  return new Promise<LatLng>((resolve) => {
    if (typeof window === "undefined" || !window.google) {
      return resolve({ lat: 28.6139, lng: 77.209 });
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (
        status === "OK" &&
        results &&
        results.length > 0 &&
        results[0].geometry
      ) {
        const location = results[0].geometry.location;
        resolve({ lat: location.lat(), lng: location.lng() });
      } else {
        resolve({ lat: 28.6139, lng: 77.209 });
      }
    });
  });
}

type Ride = {
  id: number;
  route: {
    from: string;
    to: string;
  };
};

type RideMapWrapperProps = {
  rides: Ride[];
  selectedRide: Ride | null;
  onRideSelect: (ride: Ride) => void;
};

function RideMapWrapper({
  rides,
  selectedRide,
  onRideSelect,
}: RideMapWrapperProps) {
  const libraries = ["places"] as const;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries as Library[],
  });

  const [markers, setMarkers] = useState<{ id: number; position: LatLng }[]>(
    [],
  );
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    async function setMapMarkers() {
      const markerData = await Promise.all(
        rides.map(async (ride) => ({
          id: ride.id,
          position: await geocodeAddress(ride.route.from),
        })),
      );
      setMarkers(markerData);
    }
    setMapMarkers();
  }, [rides]);

  useEffect(() => {
    async function fetchDirections() {
      if (!selectedRide) {
        setDirections(null);
        return;
      }
      if (typeof window !== "undefined" && window.google) {
        const directionsService = new window.google.maps.DirectionsService();
        const origin = await geocodeAddress(selectedRide.route.from);
        const destination = await geocodeAddress(selectedRide.route.to);
        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result) {
              setDirections(result);
            } else {
              setDirections(null);
            }
          },
        );
      }
    }
    fetchDirections();
  }, [selectedRide]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ height: "300px", width: "100%" }}
      center={{ lat: 28.6139, lng: 77.209 }}
      zoom={10}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          onClick={() => onRideSelect(rides.find((r) => r.id === marker.id)!)}
        />
      ))}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
}

export async function getEstimatedArrivalTime(
  from: string,
  to: string,
  departure: Date,
): Promise<string> {
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  await loader.load();

  const directionsService = new google.maps.DirectionsService();

  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin: from,
        destination: to,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: departure,
        },
      },
      (result, status) => {
        if (status === "OK" && result?.routes?.[0]?.legs?.[0]) {
          const leg = result.routes[0].legs[0];
          const arrivalTime = leg.arrival_time;

          if (arrivalTime) {
            resolve(arrivalTime.text); // example: "3:45 PM"
          } else {
            resolve("Unknown");
          }
        } else {
          console.warn("Google Directions API error:", status, result);
          resolve("Unknown");
        }
      },
    );
  });
}

export default function ModernDashboard() {
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [selectedDate, setSelectedDate] = useState("today");
  const [activeTab, setActiveTab] = useState("find-rides");
  const [bookingLoading, setBookingLoading] = useState(null);
  const [createdRide, setCreatedRide] = useState(null);
  const [createRideForm, setCreateRideForm] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    seats: "",
    price: "",
    preferences: {
      noSmoking: false,
      musicOk: false,
      petFriendly: false,
      quietRide: false,
    },
  });
  const [isCreatingRide, setIsCreatingRide] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [isBrowser, setIsBrowser] = useState(false);
  const createFromRef = useRef(null);
  const createToRef = useRef(null);
  useEffect(() => {
    setIsBrowser(typeof window !== "undefined");
  }, []);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const fromRef = useRef<google.maps.places.Autocomplete | null>(null);
  const toRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleFromPlaceChanged = () => {
    const place = fromRef.current.getPlace();
    if (place?.formatted_address) {
      setSearchFrom(place.formatted_address);
    }
  };

  const handleToPlaceChanged = () => {
    const place = toRef.current.getPlace();
    if (place?.formatted_address) {
      setSearchTo(place.formatted_address);
    }
  };

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const allAvailableRides = useMemo(() => {
    return [...availableRides, ...(createdRide ? [createdRide] : [])];
  }, [availableRides, createdRide]);

  useEffect(() => {
    if (!user) return;

    const fetchActiveRide = async () => {
      const q = query(
        collection(db, "rides"),
        where("userId", "==", user.uid),
        where("status", "==", "active"),
        limit(1),
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const rideDoc = querySnapshot.docs[0];
        setCreatedRide({ id: rideDoc.id, ...rideDoc.data() });
      } else {
        setCreatedRide(null); // No active ride
      }
    };

    fetchActiveRide();
  }, [user]);

  const filteredRides = useMemo(() => {
    return allAvailableRides.filter((ride) => {
      const dateMatch =
        selectedDate === "today"
          ? ride.route?.date === "Today"
          : selectedDate === "tomorrow"
            ? ride.route?.date === "Tomorrow"
            : true;

      return dateMatch;
    });
  }, [allAvailableRides, selectedDate]);

  const mockUser = {
    firstName: "John",
    lastName: "Doe",
  };

  const handleBookRide = async (ride) => {
    setBookingLoading(ride.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
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

  const normalizedRide = useMemo(() => {
    if (!createdRide) return null;

    return {
      id: createdRide.id,
      from: createdRide.from,
      to: createdRide.to,
      date: createdRide.date,
      time: createdRide.time,
      price: createdRide.price,
      createdByName: createdRide.createdByName,
      preferences: createdRide.preferences || [],
      availableSeats: createdRide.availableSeats,
      totalSeats: createdRide.totalSeats,
      status: createdRide.status,
    };
  }, [createdRide]);

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

    try {
      const rideData = {
        ...createRideForm,
        createdAt: serverTimestamp(),
        userId: user.uid,
        createdBy: user.uid,
        createdByName: user.displayName || "Anonymous",
        status: "active",
        availableSeats: parseInt(createRideForm.seats),
        totalSeats: parseInt(createRideForm.seats),
        preferences: Object.entries(createRideForm.preferences)
          .filter(([_, value]) => value)
          .map(([key]) => key), // Store preferences as an array of active ones
      };

      const docRef = await addDoc(collection(db, "rides"), rideData);

      const createdDoc = await getDoc(docRef);
      setCreatedRide({ id: createdDoc.id, ...createdDoc.data() });

      toast.success("Ride created successfully!");
      setCreateRideForm({
        from: "",
        to: "",
        date: "",
        time: "",
        seats: "",
        price: "",
        preferences: {
          noSmoking: false,
          musicOk: false,
          petFriendly: false,
          quietRide: false,
        },
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Failed to create ride.");
    }
  };

  const handleCancelRide = async () => {
    if (!createdRide || !createdRide.id || !user) return;

    try {
      const rideRef = doc(db, "rides", createdRide.id);
      const historyRef = doc(
        db,
        "users",
        user.uid,
        "rideHistory",
        createdRide.id,
      );

      await setDoc(historyRef, {
        ...createdRide,
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      });

      await deleteDoc(rideRef);

      setCreatedRide(null);
    } catch (error) {
      console.error("Cancel Ride Error:", error);
    }
  };

  const [toTime, setToTime] = useState<string>("");
  console.log("Fetch Arrival Time", {
    from: normalizedRide?.from,
    to: normalizedRide?.to,
    date: normalizedRide?.date,
    time: normalizedRide?.time,
  });

  useEffect(() => {
    if (!isLoaded || !normalizedRide) return;

    async function fetchArrivalTime() {
      const { from, to, date, time } = normalizedRide;
      if (!from || !to || !date || !time) return;

      const departure = new Date(`${date}T${time}`);

      try {
        const time = await getEstimatedArrivalTime(from, to, departure);
        setToTime(time);
      } catch (err) {
        console.error("Error estimating arrival time:", err);
      }
    }

    fetchArrivalTime();
  }, [normalizedRide, isLoaded]);

  function getSelectedPreferences() {
    const prefs = [];
    if (createRideForm.preferences.noSmoking) prefs.push("No Smoking");
    if (createRideForm.preferences.musicOk) prefs.push("Music OK");
    if (createRideForm.preferences.petFriendly) prefs.push("Pet Friendly");
    if (createRideForm.preferences.quietRide) prefs.push("Quiet Ride");
    return prefs;
  }

  if (authLoading || !user) return <div>Loading...</div>;

  return (
    <div
      className={`min-h-screen bg-black relative overflow-hidden ${nunito.className}`}
    >
      <InnerNavbar />
      <div className="relative z-10 container mx-auto px-4 py-8 mt-20">
        <div className="bg-black rounded-lg border border-green-800 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="bg-gray-900 border-b border-green-800">
              <TabsList className="grid w-full grid-cols-4 bg-transparent h-16">
                <TabsTrigger
                  value="find-rides"
                  className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-green-900 transition-all duration-300"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Rides
                </TabsTrigger>
                <TabsTrigger
                  value="create-ride"
                  className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-green-900 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ride
                </TabsTrigger>
                <TabsTrigger
                  value="calculate-route"
                  className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-green-900 transition-all duration-300"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate
                </TabsTrigger>
                <TabsTrigger
                  value="my-rides"
                  className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-green-900 transition-all duration-300"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  My Rides
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Find Rides Tab */}
            <TabsContent value="find-rides" className="p-6 space-y-6">
              <div className="text-center py-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-carpool-400 to-carpool-600 bg-clip-text text-transparent">
                    {mockUser.firstName}
                  </span>
                  ! 🚗
                </h2>
                <p className="text-white/70 text-lg">
                  Ready for your next journey? Let's find you the perfect ride!
                </p>
              </div>
              <div className="bg-black rounded-lg border border-green-800 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Find Your Perfect Ride
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {isBrowser && isLoaded ? (
                    <>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                        <Autocomplete
                          onLoad={(ref) => (fromRef.current = ref)}
                          onPlaceChanged={handleFromPlaceChanged}
                        >
                          <Input
                            placeholder="From"
                            className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500"
                            value={searchFrom}
                            onChange={(e) => setSearchFrom(e.target.value)}
                          />
                        </Autocomplete>
                      </div>

                      <div className="relative">
                        <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Autocomplete
                          onLoad={(ref) => (toRef.current = ref)}
                          onPlaceChanged={handleToPlaceChanged}
                        >
                          <Input
                            placeholder="To"
                            className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500"
                            value={searchTo}
                            onChange={(e) => setSearchTo(e.target.value)}
                          />
                        </Autocomplete>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Input
                          placeholder="From"
                          disabled
                          className="pl-10 bg-gray-800 border-gray-700 text-white/40"
                        />
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="To"
                          disabled
                          className="pl-10 bg-gray-800 border-gray-700 text-white/40"
                        />
                      </div>
                    </>
                  )}

                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="bg-carpool-600 hover:bg-carpool-700 transition-all duration-300">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              {/* Map View */}
              <RideMapWrapper
                rides={filteredRides}
                selectedRide={selectedRide}
                onRideSelect={setSelectedRide}
              />
            </TabsContent>
            {createdRide ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  Your Active Ride
                </h3>

                <div
                  key={createdRide.id}
                  className="bg-black rounded-lg border p-6 border-green-800"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Driver Info */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12 ring-2 ring-carpool-500">
                        <AvatarFallback>
                          {createdRide.createdByName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-white">
                            {createdRide.createdByName}
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
                        <p className="font-medium text-white">
                          {createdRide.time}
                        </p>
                        <p className="text-sm text-white/70 truncate">
                          {createdRide.from}
                        </p>
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
                        <p className="font-medium text-white">{toTime}</p>
                        <p className="text-sm text-white/70 truncate">
                          {createdRide.to}
                        </p>
                      </div>
                    </div>

                    {/* Ride Details & Cancel */}
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          ₹{createdRide.price}
                        </div>
                        <div className="flex items-center text-sm text-white/70">
                          <Users className="h-3 w-3 mr-1" />
                          <span>
                            {createdRide.availableSeats}/
                            {createdRide.totalSeats} seats
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleCancelRide}
                      >
                        Cancel Ride
                      </Button>
                    </div>
                  </div>

                  {/* Preferences */}
                  {createdRide.preferences?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex flex-wrap gap-2">
                        {createdRide.preferences.map((pref, index) => (
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
              </div>
            ) : (
              <TabsContent value="create-ride" className="p-6">
                <div className="bg-black rounded-lg border border-green-800 p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                      <Award className="h-6 w-6 mr-2" />
                      Create Your Ride
                    </h3>
                    <p className="text-white/80">
                      Share your journey and help others while earning
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Route Details */}
                    <div className="space-y-6">
                      <h4 className="font-semibold text-white text-lg">
                        Route Details
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-green-400 mb-2 block">
                            From
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            {isLoaded && isBrowser ? (
                              <Autocomplete
                                onLoad={(ref) => (createFromRef.current = ref)}
                                onPlaceChanged={() =>
                                  setCreateRideForm((prev) => ({
                                    ...prev,
                                    from:
                                      createFromRef.current?.getPlace()
                                        ?.formatted_address ?? prev.from,
                                  }))
                                }
                              >
                                <Input
                                  placeholder="Starting location"
                                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500"
                                  value={createRideForm.from}
                                  onChange={(e) =>
                                    setCreateRideForm({
                                      ...createRideForm,
                                      from: e.target.value,
                                    })
                                  }
                                />
                              </Autocomplete>
                            ) : (
                              <Input
                                disabled
                                placeholder="Starting location"
                                className="pl-10 bg-gray-900 border-gray-700 text-white/50"
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-200 mb-2 block">
                            To
                          </label>
                          <div className="relative">
                            <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            {isLoaded && isBrowser ? (
                              <Autocomplete
                                onLoad={(ref) => (createToRef.current = ref)}
                                onPlaceChanged={() =>
                                  setCreateRideForm((prev) => ({
                                    ...prev,
                                    to:
                                      createToRef.current?.getPlace()
                                        ?.formatted_address ?? prev.to,
                                  }))
                                }
                              >
                                <Input
                                  placeholder="Destination"
                                  className="pl-10 bg-gray-900 border-gray-700 text-white/50"
                                  value={createRideForm.to}
                                  onChange={(e) =>
                                    setCreateRideForm({
                                      ...createRideForm,
                                      to: e.target.value,
                                    })
                                  }
                                />
                              </Autocomplete>
                            ) : (
                              <Input
                                disabled
                                placeholder="Destination"
                                className="pl-10 bg-gray-900 border-gray-700 text-white/50"
                              />
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-white/90 mb-2 block">
                              Date
                            </label>
                            <Input
                              type="date"
                              className="pl-10 bg-gray-900 border-gray-700 text-white/50"
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
                            <label className="text-sm font-medium text-gray-200 mb-2 block">
                              Time
                            </label>
                            <Input
                              type="time"
                              className="pl-10 bg-gray-900 border-gray-700 text-white/50"
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
                    <div className="space-y-6">
                      <h4 className="font-semibold text-white text-lg">
                        Ride Details
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-green-400 mb-2 block">
                            Available Seats
                          </label>
                          <Select
                            value={createRideForm.seats}
                            onValueChange={(value) =>
                              setCreateRideForm({
                                ...createRideForm,
                                seats: value,
                              })
                            }
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
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
                          <label className="text-sm font-medium text-green-400 mb-2 block">
                            Price per person
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="₹ 0"
                              className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500"
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
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="mt-8 space-y-4">
                    <h4 className="font-semibold text-white text-lg">
                      Preferences
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { key: "noSmoking", label: "No Smoking" },
                        { key: "musicOk", label: "Music OK" },
                        { key: "petFriendly", label: "Pet Friendly" },
                        { key: "quietRide", label: "Quiet Ride" },
                      ].map((pref) => (
                        <label
                          key={pref.key}
                          className="flex items-center space-x-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-600 bg-gray-900 text-green-500 focus:ring-green-500"
                            checked={createRideForm.preferences[pref.key]}
                            onChange={(e) =>
                              setCreateRideForm({
                                ...createRideForm,
                                preferences: {
                                  ...createRideForm.preferences,
                                  [pref.key]: e.target.checked,
                                },
                              })
                            }
                          />
                          <span className="text-gray-300">{pref.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-8 bg-carpool-600 hover:bg-carpool-700 text-lg py-6 font-semibold transition-all duration-300"
                    onClick={handleCreateRide}
                    disabled={isCreatingRide}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {isCreatingRide ? "Creating Ride..." : "Create Ride"}
                  </Button>
                </div>
              </TabsContent>
            )}

            {/* Calculate Route Tab */}
            <TabsContent value="calculate-route" className="p-6">
              <div className="max-w-2xl mx-auto">
                {/* RouteCalculator component goes here */}
                <div className="text-white">Route Calculator Placeholder</div>
              </div>
            </TabsContent>
            {/* My Rides Tab */}
            <TabsContent value="my-rides" className="p-6">
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-gradient-to-br from-carpool-500 to-carpool-700 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Your Ride History
                </h3>
                <p className="text-white/70 mb-6">
                  Track your past and upcoming rides
                </p>
                <Button className="bg-gradient-to-r from-carpool-500 to-carpool-700">
                  View All Rides
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="fixed bottom-8 right-4 z-10">
        <FloatingButton
          size="lg"
          icon={<Plus className="h-6 w-6" />}
          onClick={() => setActiveTab("create-ride")}
          className="shadow-2xl shadow-carpool-500/30"
        />
      </div>
    </div>
  );
}
