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

import { Timestamp, DocumentData } from "firebase/firestore";
import { chatService } from "@/lib/chatService";
import { bookRideInDatabase } from "@/lib/bookRideInDatabase";

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
  updateDoc,
  increment,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import AvailableRidesList from "@/components/dashboard/AvailableRidesList";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });

type LatLng = {
  lat: number;
  lng: number;
};

async function geocodeAddress(address: string): Promise<LatLng> {
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

export type Ride = {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  createdByName: string;
  preferences: string[];
  availableSeats: number;
  totalSeats: number;
  status: string;
  userId: string;
};

type RideMapWrapperProps = {
  rides: Ride[];
  selectedRide: Ride | null;
  onRideSelect: (ride: Ride) => void;
};

type Library = "places" | "drawing" | "geometry" | "visualization";

function RideMapWrapper({
  rides,
  selectedRide,
  onRideSelect,
}: RideMapWrapperProps) {
  const libraries: Library[] = ["places"];

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [markers, setMarkers] = useState<{ id: string; position: LatLng }[]>([]);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  // Add these new state variables for user location
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Add this function to get user's current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  };

  // Add this useEffect to get user location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    async function setMapMarkers() {
      const markerData = await Promise.all(
        rides.map(async (ride) => ({
          id: ride.id,
          position: await geocodeAddress(ride.from),
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
        const origin = await geocodeAddress(selectedRide.from);
        const destination = await geocodeAddress(selectedRide.to);
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

  // Add this function to create custom blue marker icon
  const createUserLocationIcon = () => {
    if (typeof window === "undefined" || !window.google) return null;
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 8,
    };
  };

  return (
    <div className="relative">
      {/* Add location button */}
      <button
        onClick={getCurrentLocation}
        disabled={isLoadingLocation}
        className="absolute top-2 right-2 z-10 bg-white hover:bg-gray-50 p-2 rounded-lg shadow-md border border-gray-200 transition-all duration-200 disabled:opacity-50"
        title="Get my location"
      >
        {isLoadingLocation ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        ) : (
          <Navigation className="h-5 w-5 text-blue-500" />
        )}
      </button>

      <GoogleMap
        mapContainerStyle={{ height: "300px", width: "100%" }}
        center={userLocation || { lat: 28.6139, lng: 77.209 }}
        zoom={userLocation ? 12 : 10} 
      >

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => onRideSelect(rides.find((r) => r.id === marker.id)!)}
            title={`Ride from ${rides.find((r) => r.id === marker.id)?.from}`}
          />
        ))}

 
        {userLocation && createUserLocationIcon() && (
          <Marker
            position={userLocation}
            icon={createUserLocationIcon() as google.maps.Icon | google.maps.Symbol}
            title="Your current location"
            zIndex={1000} 
          />
        )}

     
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </div>
  );
}

async function getEstimatedArrivalTime(
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
            resolve(arrivalTime.text);
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
  // All state declarations
  const [userBookedRides, setUserBookedRides] = useState<string[]>([]);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const { userProfile, user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState("today");
  const [activeTab, setActiveTab] = useState("find-rides");
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [createdRide, setCreatedRide] = useState<Ride | null>(null);
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
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [toTime, setToTime] = useState<string>("");

  const createFromRef = useRef<google.maps.places.Autocomplete | null>(null);
  const createToRef = useRef<google.maps.places.Autocomplete | null>(null);
  const fromRef = useRef<google.maps.places.Autocomplete | null>(null);
  const toRef = useRef<google.maps.places.Autocomplete | null>(null);

  const router = useRouter();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  // Function to check if user already booked a ride
  const checkIfUserBookedRide = async (rideId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("rideId", "==", rideId),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking booking status:", error);
      return false;
    }
  };

  // useEffect hooks
  useEffect(() => {
    setIsBrowser(typeof window !== "undefined");
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchUserBookings = async () => {
      try {
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const bookedRideIds = querySnapshot.docs.map(doc => doc.data().rideId);
        setUserBookedRides(bookedRideIds);
      } catch (error) {
        console.error("Error fetching user bookings:", error);
      }
    };

    fetchUserBookings();
  }, [user]);

  useEffect(() => {
    const fetchAvailableRides = async () => {
      try {
        const q = query(
          collection(db, "rides"),
          where("status", "==", "active"),
          where("availableSeats", ">", 0) 
        );
        const querySnapshot = await getDocs(q);

        const rides: Ride[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as Omit<Ride, "id">;
          return {
            id: doc.id,
            ...data,
          };
        });

        setAvailableRides(rides);
      } catch (error) {
        console.error("Error fetching available rides:", error);
      }
    };

    fetchAvailableRides();
  }, []);

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
        const data = rideDoc.data() as Omit<Ride, "id">;

        setCreatedRide({
          id: rideDoc.id,
          ...data,
        });
      } else {
        setCreatedRide(null);
      }
    };

    fetchActiveRide();
  }, [user]);

  // Handler functions
  const handleFromPlaceChanged = () => {
    if (fromRef.current) {
      const place = fromRef.current.getPlace();
      if (place?.formatted_address) {
        setSearchFrom(place.formatted_address);
      }
    }
  };

  const handleToPlaceChanged = () => {
    if (toRef.current) {
      const place = toRef.current.getPlace();
      if (place?.formatted_address) {
        setSearchTo(place.formatted_address);
      }
    }
  };

  const allAvailableRides = useMemo(() => {
    return [...availableRides, ...(createdRide ? [createdRide] : [])];
  }, [availableRides, createdRide]);

  const filteredRides = useMemo(() => {
    if (!user) return [];

    return allAvailableRides.filter((ride) => 
      ride.userId !== user.uid && 
      ride.status === "active" && 
      ride.availableSeats > 0
    );
  }, [allAvailableRides, user]);

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

  // Now this useEffect can use normalizedRide
  useEffect(() => {
    if (!isLoaded || !normalizedRide) return;

    const ride = normalizedRide;

    async function fetchArrivalTime() {
      const { from, to, date, time } = ride;

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

  // Updated handleBookRide with booking check
  const handleBookRide = async (ride: Ride) => {
    if (!user) return;
    
    setBookingLoading(ride.id);

    try {
      // Check if user already booked this ride
      const alreadyBooked = await checkIfUserBookedRide(ride.id);
      if (alreadyBooked) {
        toast.error("You have already booked this ride! Click the chat button to join the conversation.");
        setBookingLoading(null);
        return;
      }

      if (ride.availableSeats <= 0) {
        toast.error("This ride is full!");
        setBookingLoading(null);
        return;
      }

      await bookRideInDatabase(ride);
      
      // Create booking record
      await addDoc(collection(db, "bookings"), {
        rideId: ride.id,
        userId: user.uid,
        userEmail: user.email,
        userName: `${userProfile?.firstName || ""} ${userProfile?.lastName || ""}`.trim(),
        bookedAt: serverTimestamp(),
        status: "active"
      });
      
      const rideRef = doc(db, "rides", ride.id);
      await updateDoc(rideRef, {
        availableSeats: increment(-1)
      });

      if (ride.availableSeats - 1 <= 0) {
        await updateDoc(rideRef, {
          status: "full"
        });
      }

      const chatRoomId = await chatService.findChatRoomByRide(ride.id);

      if (chatRoomId && user) {
        await chatService.joinChatRoom(chatRoomId, user.uid, {
          firstName: userProfile?.firstName || "Unknown",
          lastName: userProfile?.lastName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
        });
      }

      // Update local state
      setUserBookedRides(prev => [...prev, ride.id]);

      const updatedRides = availableRides.map(r => 
        r.id === ride.id 
          ? { ...r, availableSeats: r.availableSeats - 1, status: r.availableSeats - 1 <= 0 ? "full" : r.status }
          : r
      );
      setAvailableRides(updatedRides);

      toast.success(`Successfully booked ride from ${ride.from} to ${ride.to}`);
      toast.success("You've been added to the chat room 🎉");

      router.push("/chat");
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to book ride. Please try again.");
    } finally {
      setBookingLoading(null);
    }
  };

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
        userId: user!.uid,
        createdBy: user!.uid,
        createdByName:
          `${userProfile?.firstName ?? ""} ${userProfile?.lastName ?? ""}`.trim() ||
          "Anonymous",
        status: "active",
        availableSeats: parseInt(createRideForm.seats),
        totalSeats: parseInt(createRideForm.seats),
        preferences: Object.entries(createRideForm.preferences)
          .filter(([_, value]) => value)
          .map(([key]) => key),
      };

      const docRef = await addDoc(collection(db, "rides"), rideData);

      const createdDoc = await getDoc(docRef);
      const rideId = createdDoc.id;
      const data = createdDoc.data() as Omit<Ride, "id">;
      setCreatedRide({
        id: rideId,
        ...data,
      });

      await chatService.createChatRoom({
        rideId,
        userId: user!.uid,
        userDetails: {
          firstName: userProfile?.firstName || "",
          lastName: userProfile?.lastName || "",
          email: user!.email || "",
          phone: user!.phoneNumber || "",
        },
        route: {
          from: rideData.from,
          to: rideData.to,
          date: rideData.date,
          time: rideData.time,
        },
      });

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
      console.error("Error adding document or creating chat room: ", error);
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
    

  <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden ${nunito.className}`}>
    {/* Background decorative elements */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />
    <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
    
    <InnerNavbar />

    <div className="relative z-10 container mx-auto px-4 py-8 mt-20">
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-green-800/30 overflow-hidden shadow-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Enhanced Tab Navigation */}
          <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-green-800/30">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-20 p-2">
              <TabsTrigger
                value="find-rides"
                className="relative text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 transition-all duration-500 rounded-xl shadow-lg data-[state=active]:shadow-green-500/25 flex flex-col gap-1 py-3"
              >
                <Search className="h-5 w-5" />
                <span className="text-sm font-medium">Find Rides</span>
              </TabsTrigger>
              <TabsTrigger
                value="create-ride"
                className="relative text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 transition-all duration-500 rounded-xl shadow-lg data-[state=active]:shadow-blue-500/25 flex flex-col gap-1 py-3"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">Create Ride</span>
              </TabsTrigger>
              <TabsTrigger
                value="my-rides"
                className="relative text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 transition-all duration-500 rounded-xl shadow-lg data-[state=active]:shadow-purple-500/25 flex flex-col gap-1 py-3"
              >
                <Activity className="h-5 w-5" />
                <span className="text-sm font-medium">My Rides</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Find Rides Tab */}
          <TabsContent value="find-rides" className="p-8 space-y-8">
            <div className="text-center py-8">
              <WelcomeBanner />
            </div>

            {/* Enhanced Search Section */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-8 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-white">Find Your Perfect Ride</h3>
                  <p className="text-gray-400">Search for rides that match your journey</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {isBrowser && isLoaded ? (
                  <>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400 z-10" />
                      <Autocomplete
                        onLoad={(ref) => (fromRef.current = ref)}
                        onPlaceChanged={handleFromPlaceChanged}
                      >
                        <Input
                          placeholder="Pickup location"
                          className="pl-12 pr-4 py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all duration-300 group-hover:border-green-500/50"
                          value={searchFrom}
                          onChange={(e) => setSearchFrom(e.target.value)}
                        />
                      </Autocomplete>
                    </div>

                    <div className="relative group">
                      <Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 z-10" />
                      <Autocomplete
                        onLoad={(ref) => (toRef.current = ref)}
                        onPlaceChanged={handleToPlaceChanged}
                      >
                        <Input
                          placeholder="Drop-off location"
                          className="pl-12 pr-4 py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300 group-hover:border-blue-500/50"
                          value={searchTo}
                          onChange={(e) => setSearchTo(e.target.value)}
                        />
                      </Autocomplete>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        placeholder="Pickup location"
                        disabled
                        className="pl-12 pr-4 py-4 bg-gray-800/30 border-gray-700 text-white/40 rounded-xl"
                      />
                    </div>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        placeholder="Drop-off location"
                        disabled
                        className="pl-12 pr-4 py-4 bg-gray-800/30 border-gray-700 text-white/40 rounded-xl"
                      />
                    </div>
                  </>
                )}

                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="py-4 bg-gray-800/50 border-gray-600/50 text-white rounded-xl hover:border-purple-500/50 transition-all duration-300">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-purple-400 mr-2" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 rounded-xl">
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                  </SelectContent>
                </Select>

                <Button className="py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105">
                  <Search className="h-5 w-5 mr-2" />
                  Search Rides
                </Button>
              </div>
            </div>

            {/* Enhanced Map View */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-6 shadow-xl">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-green-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Route Map</h3>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-700/50">
                <RideMapWrapper
                  rides={filteredRides}
                  selectedRide={selectedRide}
                  onRideSelect={setSelectedRide}
                />
              </div>
            </div>

            {/* Enhanced Available Rides List */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Car className="h-5 w-5 text-blue-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Available Rides</h3>
                  <Badge className="ml-3 bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {filteredRides.length} rides
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <AvailableRidesList
                rides={filteredRides}
                selectedRide={selectedRide}
                onRideSelect={setSelectedRide}
                onBook={handleBookRide}
                bookingLoading={bookingLoading}
                userBookedRides={userBookedRides}
              />
            </div>
          </TabsContent>

          {/* Create Ride Tab */}
          {createdRide ? (
            <TabsContent value="create-ride" className="p-8">
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-8 shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">Your Active Ride</h3>
                    <p className="text-gray-400">Manage your current ride offering</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-700/30 p-8 shadow-lg">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Driver Info */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 ring-4 ring-green-500/30 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg font-bold">
                          {createdRide.createdByName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h4 className="text-xl font-bold text-white">
                            {createdRide.createdByName}
                          </h4>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified Driver
                          </Badge>
                        </div>
                        <p className="text-gray-400 mt-1">Ride Creator</p>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                        <p className="text-2xl font-bold text-white mb-1">
                          {createdRide.time}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {createdRide.from}
                        </p>
                        <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Departure
                        </Badge>
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                          <div className="w-20 h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full" />
                          <Car className="h-6 w-6 text-blue-400" />
                          <div className="w-20 h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 rounded-full" />
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                        <p className="text-2xl font-bold text-white mb-1">{toTime}</p>
                        <p className="text-sm text-gray-400 truncate">
                          {createdRide.to}
                        </p>
                        <Badge className="mt-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                          Arrival
                        </Badge>
                      </div>
                    </div>

                    {/* Ride Details & Actions */}
                    <div className="flex flex-col items-end space-y-4">
                      <div className="text-right p-4 bg-gray-800/30 rounded-xl">
                        <div className="text-3xl font-bold text-white mb-2">
                          ₹{createdRide.price}
                        </div>
                        {(() => {
                          const isRideFull = createdRide.availableSeats <= 0 || createdRide.status === "full";
                          return (
                            <div className="flex items-center justify-end text-sm mb-2">
                              <Users className="h-4 w-4 mr-2" />
                              <span className={isRideFull ? "text-red-400 font-semibold" : "text-gray-300"}>
                                {createdRide.availableSeats}/{createdRide.totalSeats} seats
                                {isRideFull && " (FULL)"}
                              </span>
                            </div>
                          );
                        })()}
                        {/* Enhanced Status Badge */}
                        {(() => {
                          const isRideFull = createdRide.availableSeats <= 0 || createdRide.status === "full";
                          const availabilityPercentage = (createdRide.availableSeats / createdRide.totalSeats) * 100;
                          
                          if (isRideFull) {
                            return (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1">
                                <Clock className="h-3 w-3 mr-1" />
                                Fully Booked
                              </Badge>
                            );
                          } else if (availabilityPercentage <= 25) {
                            return (
                              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-3 py-1">
                                <Star className="h-3 w-3 mr-1" />
                                Almost Full
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                                <Star className="h-3 w-3 mr-1" />
                                Available
                              </Badge>
                            );
                          }
                        })()}
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          onClick={() => router.push("/chat")}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                          onClick={handleCancelRide}
                        >
                          Cancel Ride
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Preferences */}
                  {createdRide.preferences?.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-700/30">
                      <h5 className="text-white font-semibold mb-3 flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-400" />
                        Ride Preferences
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {createdRide.preferences.map((pref, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-green-500/30 bg-green-500/10 text-green-300 px-3 py-1"
                          >
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ) : (
            <TabsContent value="create-ride" className="p-8">
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-blue-800/20 p-8 shadow-xl">
                <div className="text-center mb-10">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl w-fit mx-auto mb-4 shadow-lg">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">Create Your Ride</h3>
                  <p className="text-gray-400 text-lg">
                    Share your journey and help others while earning
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Route Details Section */}
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <MapPin className="h-5 w-5 text-blue-400 mr-2" />
                      <h4 className="font-bold text-white text-xl">Route Details</h4>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-semibold text-blue-400 mb-3  flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Pickup Location
                        </label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
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
                                placeholder="Enter starting location"
                                className="pl-12 pr-4 py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
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
                              placeholder="Enter starting location"
                              className="pl-12 pr-4 py-4 bg-gray-800/30 border-gray-700 text-white/50 rounded-xl"
                            />
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-blue-400 mb-3 flex items-center">
                          <Navigation className="h-4 w-4 mr-2" />
                          Drop-off Location
                        </label>
                        <div className="relative group">
                          <Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
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
                                placeholder="Enter destination"
                                className="pl-12 pr-4 py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
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
                              placeholder="Enter destination"
                              className="pl-12 pr-4 py-4 bg-gray-800/30 border-gray-700 text-white/50 rounded-xl"
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-blue-400 mb-3 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Date
                          </label>
                          <Input
                            type="date"
                            className="py-4 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
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
                          <label className="text-sm font-semibold text-blue-400 mb-3 flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            Time
                          </label>
                          <Input
                            type="time"
                            className="py-4 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
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

                  {/* Ride Details Section */}
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <Car className="h-5 w-5 text-green-400 mr-2" />
                      <h4 className="font-bold text-white text-xl">Ride Details</h4>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-semibold text-green-400 mb-3 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
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
                          <SelectTrigger className="py-4 bg-gray-800/50 border-gray-600/50 text-white rounded-xl hover:border-green-500/50 transition-all duration-300">
                            <SelectValue placeholder="Select number of seats" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 rounded-xl">
                            <SelectItem value="1">1 seat available</SelectItem>
                            <SelectItem value="2">2 seats available</SelectItem>
                            <SelectItem value="3">3 seats available</SelectItem>
                            <SelectItem value="4">4 seats available</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-green-400 mb-3 flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Price per Passenger
                        </label>
                        <div className="relative group">
                          <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                          <Input
                            placeholder="Enter price (₹)"
                            className="pl-12 pr-4 py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all duration-300"
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

                {/* Enhanced Preferences Section */}
                <div className="mt-10 pt-8 border-t border-gray-700/30">
                  <div className="flex items-center mb-6">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <h4 className="font-bold text-white text-xl">Ride Preferences</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(
                      [
                        { key: "noSmoking", label: "No Smoking" },
                        { key: "musicOk", label: "Music OK", },
                        { key: "petFriendly", label: "Pet Friendly",},
                        { key: "quietRide", label: "Quiet Ride", },
                      ] as const
                    ).map((pref) => (
                      <label
                        key={pref.key}
                        className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-800/30 rounded-xl hover:bg-gray-700/30 transition-all duration-300 border border-gray-700/30 hover:border-gray-600/50"
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500 focus:ring-2"
                          checked={createRideForm.preferences[pref.key]}
                          onChange={(e) =>
                            setCreateRideForm((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                [pref.key]: e.target.checked,
                              },
                            }))
                          }
                        />
                        {/* <span className="text-xl mr-2">{pref.icon}</span> */}
                        <span className="text-gray-200 font-medium">{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Enhanced Create Button */}
                <Button
                  className="w-full mt-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xl py-6 font-bold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-[1.02]"
                  onClick={handleCreateRide}
                  disabled={isCreatingRide}
                >
                  {isCreatingRide ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Creating Your Ride...
                    </>
                  ) : (
                    <>
                      <Plus className="h-6 w-6 mr-3" />
                      Create Ride & Start Journey
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Enhanced My Rides Tab */}
          <TabsContent value="my-rides" className="p-8">
            <div className="text-center py-16">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-2xl">
                <Activity className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Your Ride History
              </h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Track your past journeys and upcoming rides all in one place
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                <Calendar className="h-5 w-5 mr-2" />
                View All Rides
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>


    <div className="fixed bottom-8 right-8 z-50">
      <FloatingButton
        size="lg"
        icon={<Plus className="h-7 w-7" />}
        onClick={() => setActiveTab("create-ride")}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-110 border-2 border-blue-400/20"
      />
    </div>
  </div>
);
}