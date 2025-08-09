"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GoogleMap, useLoadScript, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";
import {
  FaCar,
  FaSearch,
  FaHome,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaPlus,
  FaUserCircle,
  FaCircle,
} from "react-icons/fa";
import BottomNav from "@/components/BottomNav";
import { Nunito } from "next/font/google";
import InnerNavbar from "@/components/InnerNavbar";
import { useRouter } from "next/navigation";

const libraries: Array<"places"> = ["places"];

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });

export default function FindRidePage() {
  const [startingPoint, setStartingPoint] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [directions, setDirections] = useState<any>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const startingPointRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const onPlaceChanged = (
    ref: React.MutableRefObject<google.maps.places.Autocomplete | null>,
    setter: (val: string) => void
  ) => {
    const place = ref.current?.getPlace();
    if (place?.formatted_address) {
      setter(place.formatted_address);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const dummyRides = [
        {
          id: "1",
          driverName: "John Doe",
          driverProfilePicture:
            "https://ui-avatars.com/api/?name=John+Doe&background=10B981&color=fff",
          startingPoint,
          destination,
          date,
          time,
          price: 100,
          availableSeats: 3,
        },
      ];
      setSearchResults(dummyRides);
      setLoading(false);

      // Request directions
      if (window.google && mapRef.current) {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: startingPoint,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else {
              console.error("Failed to fetch directions:", status);
              setDirections(null);
            }
          }
        );
      }
    }, 1000);
  };

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;
  if (authLoading || !user) return <div>Loading...</div>;

  return (
    <main className={`bg-gray-50 ${nunito.className}`}>
      <InnerNavbar />
      <div className="container mx-auto px-4 py-6 text-black mt-18">
        <h1 className="text-2xl font-bold mt-14">Find a Ride</h1>
        <p className="mb-2 text-sm text-gray-700">Search for available rides</p>

        <form onSubmit={handleSearch} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Route Details</h2>
            <div className="space-y-4">
              {/* Pickup */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location
                </label>
                <FaCircle className="text-green-500 absolute left-3 top-10 text-xs pointer-events-none" />
                <Autocomplete
                  onLoad={(ref) => (startingPointRef.current = ref)}
                  onPlaceChanged={() =>
                    onPlaceChanged(startingPointRef, setStartingPoint)
                  }
                >
                  <input
                    type="text"
                    placeholder="Where are you starting from?"
                    required
                    className="pl-10 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </Autocomplete>
              </div>

              {/* Destination */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop Location
                </label>
                <FaMapMarkerAlt className="text-red-500 absolute left-3 top-10 text-xs pointer-events-none" />
                <Autocomplete
                  onLoad={(ref) => (destinationRef.current = ref)}
                  onPlaceChanged={() =>
                    onPlaceChanged(destinationRef, setDestination)
                  }
                >
                  <input
                    type="text"
                    placeholder="Where are you going?"
                    required
                    className="pl-10 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </Autocomplete>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <FaCalendarAlt className="text-gray-400 absolute left-3 top-11 text-xs pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="pl-10 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <FaClock className="text-gray-400 absolute left-3 top-[46px] text-xs pointer-events-none" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="pl-10 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 flex items-center justify-center"
            disabled={loading}
          >
            <span>Search Rides</span>
            {loading && (
              <span className="ml-2 inline-block w-5 h-5 border-2 border-white border-t-green-500 rounded-full animate-spin"></span>
            )}
          </button>
        </form>

        {/* Results */}
        <div className="mt-6 space-y-4">
          {searchResults.length === 0 && !loading && (
            <p className="text-center text-gray-600">
              No rides found matching your criteria.
            </p>
          )}
          {searchResults.map((ride) => (
            <div
              key={ride.id}
              className="ride-card bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {ride.driverName}
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <FaMapMarkerAlt className="text-green-600 mr-2 inline" />
                      From: {ride.startingPoint}
                    </p>
                    <p className="text-gray-600">
                      <FaMapMarkerAlt className="text-green-600 mr-2 inline" />
                      To: {ride.destination}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-green-600">₹{ride.price}</p>
              </div>
              <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                <div>
                  <FaCalendarAlt className="mr-2 inline" />
                  {new Date(ride.date).toLocaleDateString()}
                </div>
                <div>
                  <FaClock className="mr-2 inline" />
                  {ride.time}
                </div>
                <div>
                  <FaUser className="mr-2 inline" />
                  {ride.availableSeats} seats left
                </div>
              </div>
              <button
                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition duration-200"
                onClick={() => alert(`Requesting ride ${ride.id}`)}
              >
                Request Ride
              </button>
            </div>
          ))}
        </div>

        {/* Google Map */}
        <div
          style={{ height: "300px", width: "100%", borderRadius: "8px" }}
          className="mt-8 mb-14 overflow-hidden"
        >
          <GoogleMap
            mapContainerStyle={{ height: "100%", width: "100%" }}
            center={{ lat: 20.5937, lng: 78.9629 }}
            zoom={5}
            onLoad={onMapLoad}
          >
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </div>

        <BottomNav />
      </div>
    </main>
  );
}