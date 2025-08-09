"use client";

import React, { useState, useRef, useEffect, useMemo, use } from "react";
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
  User,
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  Star,
  Car,
  Filter,
  Download,
  ArrowRight,
  Navigation,
  DollarSign,
  MessageCircle,
  Shield,
  Award,
  Target,
  Activity,
  Calculator,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

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
import PastRides from "@/components/dashboard/PastRides";
import { FaRupeeSign } from "react-icons/fa";

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
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
  date: string;
  toDate: string;
  time: string;
  toTime: string;
  pricePerSeat?: number;
  totalPrice?: number;
  vehicleType: "cab" | "own";
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

type PlaceMeta = {
  address: string;
  locality?: string;
  admin?: string;
  country?: string;
  coords?: { lat: number; lng: number };
};

type Library = "places" | "drawing" | "geometry" | "visualization";

const createCarIcon = () => {
  if (typeof window === "undefined" || !window.google) return null;

  return {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_0_1)">
          <path d="M6 14C6 12.8954 6.89543 12 8 12H24C25.1046 12 26 12.8954 26 14V18C26 19.1046 25.1046 20 24 20H8C6.89543 20 6 19.1046 6 18V14Z" fill="white" stroke="black" stroke-width="1.5"/>

          <path d="M26 14V18C26 18.5523 26.4477 19 27 19H28C28.5523 19 29 18.5523 29 18V16C29 15.4477 28.5523 15 28 15H27C26.4477 15 26 14.4477 26 14Z" fill="black"/>
          
          <path d="M10 12L12 8H22L24 12" fill="white" stroke="black" stroke-width="1"/>
          
          <rect x="11" y="9" width="10" height="3" fill="black" stroke="black" stroke-width="0.5"/>
          
          <circle cx="22" cy="20" r="3" fill="black" stroke="white" stroke-width="1"/>
          <circle cx="22" cy="20" r="1.5" fill="white"/>
          
          <circle cx="10" cy="20" r="3" fill="black" stroke="white" stroke-width="1"/>
          <circle cx="10" cy="20" r="1.5" fill="white"/>
          
          <circle cx="28" cy="16" r="1" fill="white" stroke="black" stroke-width="0.5"/>
          
          <rect x="8" y="15" width="16" height="1" fill="black"/>
          <rect x="12" y="13" width="8" height="0.5" fill="black"/>
        </g>
        <defs>
          <filter id="filter0_d_0_1" x="2" y="4" width="32" height="28" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_1"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_1" result="shape"/>
          </filter>
        </defs>
      </svg>
    `),
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 24),
  };
};

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

  const [markers, setMarkers] = useState<{ id: string; position: LatLng }[]>(
    [],
  );
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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
        maximumAge: 300000,
      },
    );
  };

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

  const createUserLocationIcon = () => {
    if (typeof window === "undefined" || !window.google) return null;

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: "#4285F4",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 3,
      scale: 8,
    };
  };

  return (
    <div className="relative">
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
        {markers
          .filter((marker) => selectedRide?.id !== marker.id)
          .map((marker) => {
            const ride = rides.find((r) => r.id === marker.id);

            return (
              <Marker
                key={marker.id}
                position={marker.position}
                onClick={() => onRideSelect(ride!)}
                title={`Ride from ${ride?.from}`}
                icon={createCarIcon() as google.maps.Icon | google.maps.Symbol}
              />
            );
          })}

        {userLocation && createUserLocationIcon() && (
          <Marker
            position={userLocation}
            icon={
              createUserLocationIcon() as google.maps.Icon | google.maps.Symbol
            }
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
): Promise<{ toTime: string; toDate: string }> {
  try {
    if (typeof window === "undefined" || !window.google || !google.maps) {
      console.error("Google Maps JS API is not loaded.");
      return { toTime: "Unknown", toDate: "Unknown" };
    }

    if (isNaN(departure.getTime())) {
      console.warn("Invalid departure date:", departure);
      return { toTime: "Unknown", toDate: "Unknown" };
    }

    const directionsService = new google.maps.DirectionsService();

    return new Promise((resolve) => {
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
            const durationSeconds = leg.duration?.value;

            if (durationSeconds) {
              const arrivalTimestamp = new Date(
                departure.getTime() + durationSeconds * 1000,
              );

              const formattedTime = arrivalTimestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              const formattedDate =
                arrivalTimestamp.toLocaleDateString("en-CA");

              resolve({ toTime: formattedTime, toDate: formattedDate });
            } else {
              resolve({ toTime: "Unknown", toDate: "Unknown" });
            }
          } else {
            console.warn("Google Directions API error:", status, result);
            resolve({ toTime: "Unknown", toDate: "Unknown" });
          }
        },
      );
    });
  } catch (err) {
    console.error("Error in getEstimatedArrivalTime:", err);
    return { toTime: "Unknown", toDate: "Unknown" };
  }
}

function normalize(s: string) {
  return s.toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();
}

function tokenScore(a: string, b: string) {
  const as = new Set(normalize(a).split(" "));
  const bs = new Set(normalize(b).split(" "));
  let match = 0;
  for (const t of as) if (bs.has(t)) match++;
  return match / Math.max(1, as.size);
}

function containsAny(haystack: string, needles: string[]) {
  const h = normalize(haystack);
  return needles.some((n) => h.includes(normalize(n)));
}

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat),
    lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isBetweenYMD(d: string, start: string, end: string) {
  return d >= start && d <= end;
}

function readPlaceMeta(place: google.maps.places.PlaceResult): PlaceMeta {
  const address = place.formatted_address || "";
  const comps = place.address_components || [];
  const get = (type: string) =>
    comps.find((c) => c.types.includes(type))?.long_name;
  const locality =
    get("locality") || get("sublocality") || get("administrative_area_level_2");
  const admin = get("administrative_area_level_1");
  const country = get("country");
  const coords = place.geometry?.location
    ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      }
    : undefined;
  return { address, locality, admin, country, coords };
}

function matchLocation(
  rideValue: string,
  queryMeta: PlaceMeta | null,
  queryText: string,
  rideCoords?: { lat: number; lng: number },
  queryCoords?: { lat: number; lng: number },
) {
  if (!queryMeta && !queryText) return true;

  if (queryText && containsAny(rideValue, [queryText])) return true;

  if (queryText && tokenScore(rideValue, queryText) >= 0.5) return true;

  const qNeedles = [
    queryMeta?.locality,
    queryMeta?.admin,
    queryMeta?.country,
  ].filter(Boolean) as string[];
  if (qNeedles.length && containsAny(rideValue, qNeedles)) return true;

  if (rideCoords && queryCoords) {
    const d = distanceKm(rideCoords, queryCoords);
    if (d <= 10) return true;
  }

  return false;
}

function useUserRideHistory(userId: string | undefined) {
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRideHistory() {
      if (!userId) return;
      setLoading(true);
      try {
        const rideHistoryRef = collection(db, "users", userId, "rideHistory");
        const querySnapshot = await getDocs(rideHistoryRef);
        const rides: Ride[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ride[];
        setRideHistory(rides);
      } catch (error) {
        console.error("Error fetching ride history:", error);
        setRideHistory([]);
      }
      setLoading(false);
    }

    fetchRideHistory();
  }, [userId]);

  return { rideHistory, loading };
}

export default function ModernDashboard() {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }

  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const [userBookedRides, setUserBookedRides] = useState<string[]>([]);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [fromMeta, setFromMeta] = useState<PlaceMeta | null>(null);
  const [toMeta, setToMeta] = useState<PlaceMeta | null>(null);
  const { userProfile, user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined,
  );
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("find-rides");
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [createdRide, setCreatedRide] = useState<Ride | null>(null);
  const [createRideForm, setCreateRideForm] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    seats: "",
    totalPrice: "",
    pricePerSeat: "",
    vehicleType: "",
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
  const { rideHistory, loading } = useUserRideHistory(user?.uid);
  const allAvailableRides = useMemo<Ride[]>(() => {
    return [...availableRides, ...(createdRide ? [createdRide] : [])];
  }, [availableRides, createdRide]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);

  const createFromRef = useRef<google.maps.places.Autocomplete | null>(null);
  const createToRef = useRef<google.maps.places.Autocomplete | null>(null);
  const fromRef = useRef<google.maps.places.Autocomplete | null>(null);
  const toRef = useRef<google.maps.places.Autocomplete | null>(null);

  const router = useRouter();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const checkIfUserBookedRide = async (rideId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("rideId", "==", rideId),
        where("userId", "==", user.uid),
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking booking status:", error);
      return false;
    }
  };

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

        const bookedRideIds = querySnapshot.docs.map(
          (doc) => doc.data().rideId,
        );
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
          collection(db, "Rides"),
          where("status", "==", "active"),
          where("availableSeats", ">", 0),
        );
        const querySnapshot = await getDocs(q);

        const rides: Ride[] = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as Omit<Ride, "id">;
            return {
              id: doc.id,
              ...data,
            };
          })
          .filter((ride) => ride.userId !== user?.uid);

        setAvailableRides(rides);
        setFilteredRides(rides);
      } catch (error) {
        console.error("Error fetching available rides:", error);
      }
    };

    fetchAvailableRides();
  });

  useEffect(() => {
    if (!user) return;

    const fetchActiveRide = async () => {
      const q = query(
        collection(db, "Rides"),
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

  const handleFromPlaceChanged = () => {
    if (!fromRef.current) return;
    const place = fromRef.current.getPlace();
    if (!place) return;
    const meta = readPlaceMeta(place);
    setSearchFrom(meta.address);
    setFromMeta(meta);
  };

  const handleToPlaceChanged = () => {
    if (!toRef.current) return;
    const place = toRef.current.getPlace();
    if (!place) return;
    const meta = readPlaceMeta(place);
    setSearchTo(meta.address);
    setToMeta(meta);
  };

  function handleSearch() {
    const today = new Date();
    const ymdToday = toYMD(today);
    const ymdTomorrow = toYMD(
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    );

    let dateStart: string | null = null;
    let dateEnd: string | null = null;

    if (customDateRange) {
      dateStart = customDateRange.start;
      dateEnd = customDateRange.end;
    } else if (selectedDate === "today") {
      dateStart = ymdToday;
      dateEnd = ymdToday;
    } else if (selectedDate === "tomorrow") {
      dateStart = ymdTomorrow;
      dateEnd = ymdTomorrow;
    } else if (selectedDate === "this-week") {
      dateStart = ymdToday;
      dateEnd = toYMD(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
      );
    }

    const baseFiltered = allAvailableRides.filter(
      (ride) =>
        ride.userId !== user?.uid &&
        ride.status === "active" &&
        ride.availableSeats > 0,
    );

    const results = baseFiltered.filter((ride) => {
      const fromOk = matchLocation(
        ride.from,
        fromMeta,
        searchFrom,
        ride.fromCoords,
        fromMeta?.coords,
      );

      const toOk = matchLocation(
        ride.to,
        toMeta,
        searchTo,
        ride.toCoords,
        toMeta?.coords,
      );

      if (!fromOk || !toOk) return false;

      if (dateStart && dateEnd) {
        return isBetweenYMD(ride.date, dateStart, dateEnd);
      }
      return true;
    });

    setFilteredRides(results);
  }

  const formatToAmPm = (time24: string): string => {
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const handleBookRide = async (ride: Ride) => {
    if (!user) return;

    setBookingLoading(ride.id);

    try {
      const alreadyBooked = await checkIfUserBookedRide(ride.id);
      if (alreadyBooked) {
        toast.error(
          "You have already booked this ride! Click the chat button to join the conversation.",
        );
        setBookingLoading(null);
        return;
      }

      if (ride.availableSeats <= 0) {
        toast.error("This ride is full!");
        setBookingLoading(null);
        return;
      }

      await bookRideInDatabase(ride);

      await addDoc(collection(db, "bookings"), {
        rideId: ride.id,
        userId: user.uid,
        userEmail: user.email,
        userName:
          `${userProfile?.firstName || ""} ${userProfile?.lastName || ""}`.trim(),
        bookedAt: serverTimestamp(),
        status: "active",
      });

      const rideRef = doc(db, "Rides", ride.id);
      await updateDoc(rideRef, {
        availableSeats: increment(-1),
      });

      if (ride.availableSeats - 1 <= 0) {
        await updateDoc(rideRef, {
          status: "full",
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

      setUserBookedRides((prev) => [...prev, ride.id]);

      const updatedRides = availableRides.map((r) =>
        r.id === ride.id
          ? {
              ...r,
              availableSeats: r.availableSeats - 1,
              status: r.availableSeats - 1 <= 0 ? "full" : r.status,
            }
          : r,
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
    // Updated validation to check the correct fields based on vehicle type
    const isPriceFieldValid =
      createRideForm.vehicleType === "cab"
        ? createRideForm.totalPrice
        : createRideForm.pricePerSeat;

    if (
      !createRideForm.from ||
      !createRideForm.to ||
      !createRideForm.date ||
      !createRideForm.time ||
      !createRideForm.vehicleType ||
      !createRideForm.seats ||
      !isPriceFieldValid
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const departure = new Date(`${createRideForm.date}T${createRideForm.time}`);
    const { toTime, toDate } = await getEstimatedArrivalTime(
      createRideForm.from,
      createRideForm.to,
      departure,
    );

    try {
      const rideData = {
        from: createRideForm.from,
        to: createRideForm.to,
        date: createRideForm.date,
        time: createRideForm.time,
        seats: createRideForm.seats,
        vehicleType: createRideForm.vehicleType,
        createdAt: serverTimestamp(),
        userId: user!.uid,
        createdBy: user!.uid,
        toTime: toTime,
        toDate: toDate,
        createdByName:
          `${userProfile?.firstName ?? ""} ${userProfile?.lastName ?? ""}`.trim() ||
          "Anonymous",
        status: "active",
        availableSeats: parseInt(createRideForm.seats),
        totalSeats: parseInt(createRideForm.seats),
        preferences: Object.entries(createRideForm.preferences)
          .filter(([_, value]) => value)
          .map(([key]) => key),
        ...(createRideForm.vehicleType === "cab" && {
          totalPrice: parseFloat(createRideForm.totalPrice),
        }),
        ...(createRideForm.vehicleType === "own" && {
          pricePerSeat: parseFloat(createRideForm.pricePerSeat),
        }),
      };

      const docRef = await addDoc(collection(db, "Rides"), rideData);

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
        totalPrice: "",
        pricePerSeat: "",
        vehicleType: "",
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
      const rideRef = doc(db, "Rides", createdRide.id);
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
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative overflow-hidden ${nunito.className} pb-0 md:pb-0`}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <InnerNavbar />

      {/* Desktop Navigation - Top */}
      <div className="hidden md:block relative z-10 container mx-auto px-4 mt-20">
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-800/30 rounded-2xl p-2 mb-8">
          <div className="grid w-full grid-cols-4 bg-transparent h-20 gap-2">
            <button
              onClick={() => setActiveTab("find-rides")}
              className={`relative transition-all duration-500 rounded-xl shadow-lg flex flex-col gap-1 py-3 px-4 ${
                activeTab === "find-rides"
                  ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/25"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Search className="h-5 w-5 mx-auto" />
              <span className="text-sm font-medium">Find Rides</span>
            </button>
            <button
              onClick={() => setActiveTab("create-ride")}
              className={`relative transition-all duration-500 rounded-xl shadow-lg flex flex-col gap-1 py-3 px-4 ${
                activeTab === "create-ride"
                  ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/25"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Plus className="h-5 w-5 mx-auto" />
              <span className="text-sm font-medium">Create Ride</span>
            </button>
            <button
              onClick={() => setActiveTab("my-rides")}
              className={`relative transition-all duration-500 rounded-xl shadow-lg flex flex-col gap-1 py-3 px-4 ${
                activeTab === "my-rides"
                  ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/25"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Activity className="h-5 w-5 mx-auto" />
              <span className="text-sm font-medium">My Rides</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`relative transition-all duration-500 rounded-xl shadow-lg flex flex-col gap-1 py-3 px-4 ${
                activeTab === "profile"
                  ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/25"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <User className="h-5 w-5 mx-auto" />
              <span className="text-sm font-medium">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl border-t border-green-800/30 pb-safe">
        <div className="grid w-full grid-cols-4 bg-transparent h-16 p-2">
          <button
            onClick={() => setActiveTab("find-rides")}
            className={`relative transition-all duration-500 rounded-xl shadow-lg flex flex-col gap-1 py-2 px-2 ${
              activeTab === "find-rides"
                ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/25"
                : "text-gray-400"
            }`}
          >
            <Search className="h-4 w-4 mx-auto" />
            <span className="text-xs font-medium">Find</span>
          </button>
          <button
            onClick={() => setActiveTab("create-ride")}
            className={`relative transition-all duration-500 rounded-xl shadow-lg flex flex-col gap-1 py-2 px-2 ${
              activeTab === "create-ride"
                ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/25"
                : "text-gray-400"
            }`}
          >
            <Plus className="h-4 w-4 mx-auto" />
            <span className="text-xs font-medium">Create</span>
          </button>
          <button
            onClick={() => setActiveTab("my-rides")}
            className={`relative transition-all duration-500 rounded-xl shadow-lg flex flex-col gap-1 py-2 px-2 ${
              activeTab === "my-rides"
                ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/25"
                : "text-gray-400"
            }`}
          >
            <Activity className="h-4 w-4 mx-auto" />
            <span className="text-xs font-medium">My Rides</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`relative transition-all duration-500 rounded-xl shadow-lg flex flex-col gap-1 py-2 px-2 ${
              activeTab === "profile"
                ? "text-white bg-gradient-to-r from-green-600 to-green-700 shadow-green-500/25"
                : "text-gray-400"
            }`}
          >
            <User className="h-4 w-4 mx-auto" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-8 md:mt-4 mb-20 md:mb-6">
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-green-800/30 overflow-hidden shadow-2xl">
          {/* Find Rides Content */}
          {activeTab === "find-rides" && (
            <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="text-center py-4 sm:py-8">
                <WelcomeBanner />
              </div>

              {/* Enhanced Search Section */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-4 sm:p-6 lg:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:mb-6">
                  <div className="sm:ml-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      Find Your Perfect Ride
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base">
                      Search for rides that match your journey
                    </p>
                  </div>
                </div>

                {/* Top Row - Three Input Fields */}
                <div className="flex flex-wrap justify-center sm:justify-start lg:justify-center gap-3 sm:gap-4 lg:gap-6 mb-4">
                  {isBrowser && isLoaded ? (
                    <>
                      <div className="relative group w-full sm:w-auto sm:flex-1 sm:max-w-sm lg:flex-none lg:w-full lg:max-w-sm">
                        <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-400 z-10" />
                        <Autocomplete
                          onLoad={(ref) => (fromRef.current = ref)}
                          onPlaceChanged={handleFromPlaceChanged}
                        >
                          <Input
                            placeholder="Pickup location"
                            className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all duration-300 group-hover:border-green-500/50 text-sm sm:text-base w-full"
                            value={searchFrom}
                            onChange={(e) => setSearchFrom(e.target.value)}
                          />
                        </Autocomplete>
                      </div>

                      <div className="relative group w-full sm:w-auto sm:flex-1 sm:max-w-sm lg:flex-none lg:w-full lg:max-w-sm">
                        <Navigation className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-blue-400 z-10" />
                        <Autocomplete
                          onLoad={(ref) => (toRef.current = ref)}
                          onPlaceChanged={handleToPlaceChanged}
                        >
                          <Input
                            placeholder="Drop-off location"
                            className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300 group-hover:border-blue-500/50 text-sm sm:text-base w-full"
                            value={searchTo}
                            onChange={(e) => setSearchTo(e.target.value)}
                          />
                        </Autocomplete>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm lg:flex-none lg:w-full lg:max-w-sm">
                        <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                        <Input
                          placeholder="Pickup location"
                          disabled
                          className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/30 border-gray-700 text-white/40 rounded-xl text-sm sm:text-base w-full"
                        />
                      </div>
                      <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm lg:flex-none lg:w-full lg:max-w-sm">
                        <Navigation className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                        <Input
                          placeholder="Drop-off location"
                          disabled
                          className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/30 border-gray-700 text-white/40 rounded-xl text-sm sm:text-base w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* Date Picker */}
                  <div className="w-full sm:w-auto sm:flex-1 sm:max-w-sm lg:flex-none lg:w-full lg:max-w-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white rounded-xl hover:border-purple-500/50 transition-all duration-300 text-sm sm:text-base w-full"
                        >
                          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 mr-2" />
                          {customDateRange
                            ? customDateRange.start
                            : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 rounded-xl">
                        <div className="p-3">
                          <Calendar
                            mode="single"
                            selected={
                              customDateRange
                                ? new Date(customDateRange.start)
                                : undefined
                            }
                            onSelect={(date: Date | undefined) => {
                              if (!date) {
                                setCustomDateRange(null);
                                return;
                              }
                              const selectedDate = toYMD(date);
                              setCustomDateRange({
                                start: selectedDate,
                                end: selectedDate,
                              });
                              setSelectedDate(undefined);
                            }}
                            className="rounded-md"
                          />
                          <div className="flex justify-end p-2 gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCustomDateRange(null)}
                            >
                              Clear
                            </Button>
                            <Button size="sm" onClick={handleSearch}>
                              Apply
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Bottom Row - Centered Action Buttons */}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleSearch}
                    className="py-3 sm:py-4 px-6 sm:px-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Search Rides
                  </Button>

                  <Button
                    onClick={() => {
                      const baseFiltered = allAvailableRides.filter(
                        (ride) =>
                          ride.userId !== user?.uid &&
                          ride.status === "active" &&
                          ride.availableSeats > 0,
                      );
                      setFilteredRides(baseFiltered);

                      setSearchFrom("");
                      setSearchTo("");
                      setSelectedDate(undefined);
                      setCustomDateRange(null);
                      setFromMeta(null);
                      setToMeta(null);
                    }}
                    variant="outline"
                    className="py-3 sm:py-4 px-6 sm:px-8 bg-gray-800/50 border-gray-600/50 text-white hover:bg-gray-700/50 hover:border-gray-500/50 rounded-xl transition-all duration-300 text-sm sm:text-base"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Enhanced Map View */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-3 sm:p-4 lg:p-6 shadow-xl">
                <div className="flex items-center mb-3 sm:mb-4">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2" />
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Route Map
                  </h3>
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
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-3 sm:p-4 lg:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <div className="flex items-center">
                    <Car className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      Available Rides
                    </h3>
                    <Badge className="ml-2 sm:ml-3 bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs sm:text-sm">
                      {filteredRides.length} rides
                    </Badge>
                  </div>
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
            </div>
          )}

          {/* Create Ride Content */}
          {activeTab === "create-ride" &&
            (createdRide ? (
              <div className="p-3 sm:p-6 xl2:p-8">
                <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-4 sm:p-6 xl2:p-8 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg mb-3 sm:mb-0">
                      <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="sm:ml-4">
                      <h3 className="text-xl sm:text-2xl font-bold text-white">
                        Your Active Ride
                      </h3>
                      <p className="text-gray-400 text-sm sm:text-base">
                        Manage your current ride offering
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-700/30 p-4 sm:p-6 xl2:p-8 shadow-lg">
                    <div className="flex flex-col xl2:flex-row gap-6 sm:gap-8 xl2:gap-10">
                      {/* Driver Info */}
                      <div className="flex items-center space-x-3 sm:space-x-4 xl2:min-w-fit">
                        <Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-4 ring-green-500/30 shadow-lg">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-sm sm:text-lg font-bold">
                            {createdRide.createdByName
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                            <h4 className="text-lg sm:text-xl font-bold text-white">
                              {createdRide.createdByName}
                            </h4>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 sm:px-3 py-1 text-xs sm:text-sm w-fit">
                              <Shield className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                              Verified Driver
                            </Badge>
                          </div>
                          <p className="text-gray-400 mt-1 text-sm sm:text-base">
                            Ride Creator
                          </p>
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-center">
                        <div className="text-center p-4 sm:p-5 bg-gray-800/30 rounded-xl border border-gray-700/20">
                          {/* Add departure date */}
                          <p className="text-xs sm:text-sm text-green-400 font-medium mb-2">
                            {createdRide.date}
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-white mb-2">
                            <span>{formatToAmPm(createdRide.time)}</span>
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate mb-3">
                            {createdRide.from}
                          </p>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                            Departure
                          </Badge>
                        </div>

                        <div className="flex items-center justify-center order-3 sm:order-2">
                          <div className="flex items-center space-x-2 sm:space-x-1">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse" />
                            <div className="w-5 sm:w-20 h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-full" />
                            <Car className="h-3 w-3 sm:h-6 sm:w-6 text-blue-400" />
                            <div className="w-5 sm:w-20 h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 rounded-full" />
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse" />
                          </div>
                        </div>

                        <div className="text-center p-4 sm:p-5 bg-gray-800/30 rounded-xl border border-gray-700/20 order-2 sm:order-3">
                          {/* Add arrival date */}
                          <p className="text-xs sm:text-sm text-green-400 font-medium mb-2">
                            {createdRide.toDate
                              ? createdRide.toDate
                              : createdRide.date}
                          </p>
                          <p className="text-xl sm:text-2xl font-bold text-white mb-2">
                            {createdRide.toTime}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate mb-3">
                            {createdRide.to}
                          </p>
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                            Arrival
                          </Badge>
                        </div>
                      </div>

                      {/* Ride Details & Actions */}
                      <div className="flex flex-col items-center xl2:items-end space-y-4 sm:space-y-5 xl2:min-w-fit">
                        <div className="text-center xl2:text-right p-4 sm:p-5 rounded-xl w-full xl2:w-auto xl2:min-w-[200px]">
                          <div className="text-xs text-gray-400 mb-1">
                            {createdRide.vehicleType === "cab"
                              ? "Total Fare"
                              : "Per Seat"}
                          </div>
                          <div className="text-2xl sm:text-3xl font-bold text-white mb-3">
                            {createdRide.vehicleType === "cab"
                              ? `₹${createdRide.totalPrice}`
                              : `₹${createdRide.pricePerSeat}`}
                          </div>
                          {(() => {
                            const isRideFull =
                              createdRide.availableSeats <= 0 ||
                              createdRide.status === "full";
                            return (
                              <div className="flex items-center justify-center xl2:justify-end text-xs sm:text-sm mb-3">
                                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                <span
                                  className={
                                    isRideFull
                                      ? "text-red-400 font-semibold"
                                      : "text-gray-300"
                                  }
                                >
                                  {createdRide.availableSeats}/
                                  {createdRide.totalSeats} seats
                                  {isRideFull && " (FULL)"}
                                </span>
                              </div>
                            );
                          })()}
                          {/* Enhanced Status Badge */}
                          {(() => {
                            const isRideFull =
                              createdRide.availableSeats <= 0 ||
                              createdRide.status === "full";
                            const availabilityPercentage =
                              (createdRide.availableSeats /
                                createdRide.totalSeats) *
                              100;

                            if (isRideFull) {
                              return (
                                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 px-2 sm:px-3 py-1 text-xs">
                                  <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                  Fully Booked
                                </Badge>
                              );
                            } else if (availabilityPercentage <= 25) {
                              return (
                                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 px-2 sm:px-3 py-1 text-xs">
                                  <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                  Almost Full
                                </Badge>
                              );
                            } else {
                              return (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-2 sm:px-3 py-1 text-xs">
                                  <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                  Available
                                </Badge>
                              );
                            }
                          })()}
                        </div>

                        <div className="flex flex-col sm:flex-row xl2:flex-col space-y-2 sm:space-y-0 sm:space-x-3 xl2:space-x-0 xl2:space-y-2 w-full xl2:w-auto">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm flex-1 xl2:flex-none xl2:min-w-[120px]"
                            onClick={() => router.push("/chat")}
                          >
                            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Chat
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm flex-1 xl2:flex-none xl2:min-w-[120px]"
                            onClick={handleCancelRide}
                          >
                            Cancel Ride
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Preferences */}
                    {createdRide.preferences?.length > 0 && (
                      <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-700/30">
                        <h5 className="text-white font-semibold mb-4 flex items-center text-sm sm:text-base">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-yellow-400" />
                          Ride Preferences
                        </h5>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {createdRide.preferences.map((pref, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-green-500/30 bg-green-500/10 text-green-300 px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                            >
                              {pref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-6 lg:p-8">
                <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-blue-800/20 p-4 sm:p-6 lg:p-8 shadow-xl">
                  <div className="text-center mb-6 sm:mb-8 lg:mb-10">
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl w-fit mx-auto mb-3 sm:mb-4 shadow-lg">
                      <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Create Your Ride
                    </h3>
                    <p className="text-gray-400 text-base sm:text-lg">
                      Share your journey and help others while earning
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                    {/* Route Details Section */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2" />
                        <h4 className="font-bold text-white text-lg sm:text-xl">
                          Route Details
                        </h4>
                      </div>

                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <label className="text-sm font-semibold text-blue-400 mb-2 sm:mb-3 flex items-center">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Pickup Location
                          </label>
                          <div className="relative group">
                            <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10" />
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
                                  className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300 text-sm sm:text-base"
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
                                className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/30 border-gray-700 text-white/50 rounded-xl text-sm sm:text-base"
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-blue-400 mb-2 sm:mb-3 flex items-center">
                            <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Drop-off Location
                          </label>
                          <div className="relative group">
                            <Navigation className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10" />
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
                                  className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300 text-sm sm:text-base"
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
                                className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/30 border-gray-700 text-white/50 rounded-xl text-sm sm:text-base"
                              />
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="text-sm font-semibold text-blue-400 mb-2 sm:mb-3 flex items-center">
                              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Date
                            </label>
                            <Input
                              type="date"
                              className="py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300 text-sm sm:text-base"
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
                            <label className="text-sm font-semibold text-blue-400 mb-2 sm:mb-3 flex items-center">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Time
                            </label>
                            <Input
                              type="time"
                              className="py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300 text-sm sm:text-base"
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
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center mb-3 sm:mb-4">
                        <Car className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2" />
                        <h4 className="font-bold text-white text-lg sm:text-xl">
                          Ride Details
                        </h4>
                      </div>

                      <div className="space-y-4 sm:space-y-6">
                        <div>
                          <label className="text-sm font-semibold text-green-400 mb-2 sm:mb-3 flex items-center">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
                            <SelectTrigger className="py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white rounded-xl hover:border-green-500/50 transition-all duration-300 text-sm sm:text-base">
                              <SelectValue placeholder="Select number of seats" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 rounded-xl">
                              <SelectItem value="1">
                                1 seat available
                              </SelectItem>
                              <SelectItem value="2">
                                2 seats available
                              </SelectItem>
                              <SelectItem value="3">
                                3 seats available
                              </SelectItem>
                              <SelectItem value="4">
                                4 seats available
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Vehicle Type Section */}
                        <div>
                          <label className="text-sm font-semibold text-green-400 mb-2 sm:mb-3 flex items-center">
                            <Car className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Vehicle Type
                          </label>
                          <Select
                            value={createRideForm.vehicleType}
                            onValueChange={(value) =>
                              setCreateRideForm({
                                ...createRideForm,
                                vehicleType: value,
                                // Reset both price fields when vehicle type changes
                                totalPrice: "",
                                pricePerSeat: "",
                              })
                            }
                          >
                            <SelectTrigger className="py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white rounded-xl hover:border-green-500/50 transition-all duration-300 text-sm sm:text-base">
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 rounded-xl">
                              <SelectItem value="own">Own Vehicle</SelectItem>
                              <SelectItem value="cab">Cab/Taxi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Conditional Pricing Section */}
                        {createRideForm.vehicleType && (
                          <div>
                            <label className="text-sm font-semibold text-green-400 mb-2 sm:mb-3 flex items-center">
                              <FaRupeeSign className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              {createRideForm.vehicleType === "cab"
                                ? "Total Price"
                                : "Price per Passenger"}
                            </label>
                            <div className="relative group">
                              <FaRupeeSign className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10" />
                              <Input
                                placeholder={
                                  createRideForm.vehicleType === "cab"
                                    ? "Enter total cab fare (₹)"
                                    : "Enter price per passenger (₹)"
                                }
                                className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl transition-all duration-300 text-sm sm:text-base"
                                value={
                                  createRideForm.vehicleType === "cab"
                                    ? createRideForm.totalPrice
                                    : createRideForm.pricePerSeat
                                }
                                onChange={(e) =>
                                  setCreateRideForm({
                                    ...createRideForm,
                                    [createRideForm.vehicleType === "cab"
                                      ? "totalPrice"
                                      : "pricePerSeat"]: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Preferences Section */}
                  <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-700/30">
                    <div className="flex items-center mb-4 sm:mb-6">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2" />
                      <h4 className="font-bold text-white text-lg sm:text-xl">
                        Ride Preferences
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {(
                        [
                          { key: "noSmoking", label: "No Smoking" },
                          { key: "musicOk", label: "Music OK" },
                          { key: "petFriendly", label: "Pet Friendly" },
                          { key: "quietRide", label: "Quiet Ride" },
                        ] as const
                      ).map((pref) => (
                        <label
                          key={pref.key}
                          className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-3 sm:p-4 bg-gray-800/30 rounded-xl hover:bg-gray-700/30 transition-all duration-300 border border-gray-700/30 hover:border-gray-600/50"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500 focus:ring-2"
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
                          <span className="text-gray-200 font-medium text-sm sm:text-base">
                            {pref.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Create Button */}
                  <Button
                    className="w-full mt-8 sm:mt-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg sm:text-xl py-4 sm:py-6 font-bold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-[1.02]"
                    onClick={handleCreateRide}
                    disabled={isCreatingRide}
                  >
                    {isCreatingRide ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white mr-2 sm:mr-3"></div>
                        Creating Your Ride...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                        Create Ride & Start Journey
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}

          {/* Rides History */}
          {activeTab === "my-rides" && (
            <div className="p-3 sm:p-6 lg:p-8">
              <PastRides pastRides={rideHistory || []} userId={user?.uid} />
            </div>
          )}

          {/* Profile Content */}
          {activeTab === "profile" && (
            <div className="p-3 sm:p-6 lg:p-8">
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-orange-800/20 p-4 sm:p-6 lg:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 sm:mb-8">
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg mb-4 sm:mb-0">
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Your Profile
                    </h3>
                    <p className="text-gray-400 text-base sm:text-lg">
                      Manage your account and preferences
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Profile Info */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 p-4 sm:p-6 bg-gray-900/50 rounded-xl border border-gray-700/30">
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-orange-500/30 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-lg sm:text-xl font-bold">
                          {userProfile?.firstName?.[0]}
                          {userProfile?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-white">
                          {userProfile?.firstName} {userProfile?.lastName}
                        </h4>
                        <p className="text-gray-400 text-sm sm:text-base">
                          {user?.email}
                        </p>
                        <Badge className="mt-2 bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified User
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-white flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-400" />
                        Account Statistics
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                          <p className="text-2xl font-bold text-green-400">
                            12
                          </p>
                          <p className="text-sm text-gray-400">Rides Taken</p>
                        </div>
                        <div className="text-center p-4 bg-gray-800/30 rounded-xl">
                          <p className="text-2xl font-bold text-blue-400">5</p>
                          <p className="text-sm text-gray-400">Rides Created</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settings & Actions */}
                  <div className="space-y-6">
                    <h5 className="text-lg font-semibold text-white">
                      Settings & Actions
                    </h5>

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Edit Profile
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <Shield className="h-4 w-4 mr-3" />
                        Privacy Settings
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <MessageCircle className="h-4 w-4 mr-3" />
                        Support
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start border-red-600 text-red-400 hover:bg-red-700 hover:text-white"
                        onClick={() => {
                          // Add logout functionality
                          console.log("Logout clicked");
                        }}
                      >
                        <Activity className="h-4 w-4 mr-3" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FloatingButton - Only show on desktop and when not on create-ride tab */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        {activeTab !== "create-ride" && (
          <FloatingButton
            size="lg"
            icon={<Plus className="h-7 w-7" />}
            onClick={() => setActiveTab("create-ride")}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-2xl shadow-green-600/50 hover:shadow-green-700/60 transition-all duration-300 transform hover:scale-110 border-2 border-green-500/40"
          />
        )}
      </div>

      {/* ── PWA INSTALL (floats bottom-left) */}
      {isInstallable && !isInstalled && (
        <div className="fixed left-4 bottom-24 md:bottom-8 z-50">
          <Button
            onClick={handleInstallClick}
            className="flex items-center gap-2 rounded-full bg-green-600 text-white
                 hover:bg-green-700 shadow-lg hover:shadow-xl px-4 py-3
                 transition-all duration-200"
          >
            <Download size={20} />
            Install&nbsp;App
          </Button>
        </div>
      )}
    </div>
  );
}
