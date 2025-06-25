"use client";

import React, { useState, useRef } from "react";
import { GoogleMap, DirectionsRenderer } from "@react-google-maps/api";
import { useLoadScript, type Library } from "@react-google-maps/api";
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
  FaCheckCircle
} from "react-icons/fa";
import { main } from "framer-motion/client";
import { Nunito } from "next/font/google";
import InnerNavbar from "@/components/InnerNavbar";

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

  const [rideDate, setRideDate] = useState("");
  const [rideTime, setRideTime] = useState("");
  const [routeInfo, setRouteInfo] = useState<string | null>(null);

  // Vehicle Section
  const [vehicle, setVehicle] = useState("");
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [availableSeats, setAvailableSeats] = useState("");

  // Price Section
  const [pricePerSeat, setPricePerSeat] = useState("");

  // Additional Details
  const [rideNotes, setRideNotes] = useState("");
  const [womenOnly, setWomenOnly] = useState(false);

  // Error States
  const [startingPointError, setStartingPointError] = useState(false);
  const [destinationError, setDestinationError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [vehicleError, setVehicleError] = useState(false);
  const [seatsError, setSeatsError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [formError, setFormError] = useState("");

  // Spinner state
  const [submitting, setSubmitting] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
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

      // Show directions on map
      if (window.google && mapRef.current) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: startingPoint,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else {
              setDirections(null);
            }
          },
        );
      }
    }, 1200);
  };

  // Handle vehicle select
  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVehicle(e.target.value);
    setVehicleError(false);
    setShowAddVehicle(e.target.value === "add");
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    setFormError("");
    if (!startingPoint) { setStartingPointError(true); valid = false; } else { setStartingPointError(false);}
    if (!destination) { setDestinationError(true); valid = false; } else { setDestinationError(false);}
    if (!rideDate) { setDateError(true); valid = false; } else { setDateError(false);}
    if (!rideTime) { setTimeError(true); valid = false; } else { setTimeError(false);}
    if (!vehicle) { setVehicleError(true); valid = false; } else { setVehicleError(false);}
    if (!availableSeats) { setSeatsError(true); valid = false; } else { setSeatsError(false);}
    if (!pricePerSeat || Number(pricePerSeat) < 0) { setPriceError(true); valid = false; } else { setPriceError(false);}
    if (showAddVehicle && (!vehicleModel || !vehicleColor || !licensePlate)) valid = false;
    if (!valid) return setFormError("Please fill all required fields correctly.");
    setSubmitting(true);
    // Simulate async
    setTimeout(() => {
      setSubmitting(false);
      alert("Ride posted!");
    }, 1000);
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <main className={`bg-gray-50  ${nunito.className}`}>
      <InnerNavbar />
      <div className="container mx-auto px-4 py-6 text-black mt-18">
        <h1 className="text-2xl font-bold mt-14">Offer a Ride</h1>
        <p className="mb-2 text-sm text-gray-700">Share your journey with fellow students</p>
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Route Details</h2>
            <div className="space-y-4">
              {/* Pickup Location */}
              <div className="relative">
                <label
                  htmlFor="startingPoint"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pickup Location
                </label>
                <FaCircle className="text-green-500 absolute left-3 top-10 text-xs pointer-events-none" />
                <input
                  type="text"
                  id="startingPoint"
                  value={startingPoint}
                  onChange={(e) => setStartingPoint(e.target.value)}
                  placeholder="Where are you starting from?"
                  required
                  className="pl-10 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              {/* Drop Location */}
              <div className="relative">
                <label
                  htmlFor="destination"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Drop Location
                </label>
                <FaMapMarkerAlt className="text-red-500 absolute left-3 top-10 text-xs pointer-events-none" />
                <input
                  type="text"
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where are you going?"
                  required
                  className="pl-10 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Date
                  </label>
                  <FaCalendarAlt className="text-gray-400 absolute left-3 top-10 text-xs pointer-events-none" />
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="pl-10 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="relative">
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Time
                  </label>
                  <FaClock className="text-gray-400 absolute left-3 top-10 text-xs pointer-events-none" />
                  <input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="pl-10 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Search Button */}
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
                    <img
                      src={ride.driverProfilePicture}
                      alt="Driver"
                      className="w-10 h-10 rounded-full object-cover"
                    />
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
                <p className="text-lg font-bold text-green-600">
                  ₹{ride.price}
                </p>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <FaCalendarAlt className="mr-2 inline" />
                  {new Date(ride.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <FaClock className="mr-2 inline" />
                  {ride.time}
                </div>
                <div className="flex items-center text-sm text-gray-500">
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

          {/* Vehicle Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">Vehicle Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle</label>
                <select
                  value={vehicle}
                  onChange={handleVehicleChange}
                  required
                  className="block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a vehicle</option>
                  <option value="uber">Uber</option>
                  <option value="ola">Ola</option>
                  <option value="other">Other</option>
                  <option value="add">+ Add New Vehicle</option>
                </select>
                {vehicleError && <p className="error-message text-red-600 block">Please select a vehicle</p>}
              </div>

              {showAddVehicle && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Make & Model</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={e => setVehicleModel(e.target.value)}
                      placeholder="e.g., Honda City"
                      className="block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Color</label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={e => setVehicleColor(e.target.value)}
                      placeholder="e.g., White"
                      className="block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Plate Number</label>
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={e => setLicensePlate(e.target.value)}
                      placeholder="e.g., KA01AB1234"
                      className="block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Seats</label>
                <select
                  value={availableSeats}
                  onChange={e => { setAvailableSeats(e.target.value); setSeatsError(false); }}
                  required
                  className="block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select available seats</option>
                  <option value="1">1 seat</option>
                  <option value="2">2 seats</option>
                  <option value="3">3 seats</option>
                  <option value="4">4 seats</option>
                </select>
                {seatsError && <p className="error-message text-red-600 block">Please select available seats</p>}
              </div>
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">Price Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price per Seat</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={pricePerSeat}
                    onChange={e => { setPricePerSeat(e.target.value); setPriceError(false); }}
                    required
                    placeholder="0"
                    className="pl-8 block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500  focus:border-green-500"
                  />
                </div>
                {priceError && <p className="error-message text-red-600 block">Please enter a valid price</p>}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 m-4">
            <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Co-passengers (Optional)</label>
                <textarea
                  value={rideNotes}
                  onChange={e => setRideNotes(e.target.value)}
                  className="block w-full rounded-lg bg-white border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Any specific instructions or information..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={womenOnly}
                  onChange={e => setWomenOnly(e.target.checked)}
                  className="h-4 w-4 bg-white text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  id="womenOnly"
                />
                <label htmlFor="womenOnly" className="ml-2 block text-sm text-gray-700">
                  Women passengers only
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mb-14 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 flex items-center justify-center"
            disabled={submitting}
          >
            <FaCheckCircle className="mr-2" />
            <span>Post Ride</span>
            {submitting && <div className="loading-spinner ml-2" />}
          </button>
          {formError && <p className="error-message text-center text-red-600">{formError}</p>}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="flex justify-around items-center h-16">
            <a className="bottom-nav-item active flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-full">
              <FaHome className="text-xl mb-1" />
              <span>Home</span>
            </a>
            {/* </Link> */}
            <a
              href="/dashboard/find"
              className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-full"
            >
              <FaSearch className="text-xl mb-1 " />
              <span>Find</span>
            </a>
            <a
              href="/dashboard/offer"
              className="bottom-nav-item flex flex-col items-center text-sm text-black relative bg-green-500"
            >
              <div className="absolute -top-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 hover:border-black border-white bg-green-500 hover:bg-green-400">
                <FaPlus className="text-black text-lg" />
              </div>
              <FaCar className="text-xl mb-1" />
            </a>
            <a
              href="/rides"
              className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-full"
            >
              <FaCar className="text-xl mb-1" />
              <span>My Rides</span>
            </a>
            <a
              href="/profile"
              className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-full"
            >
              <FaUserCircle className="text-xl mb-1" />
              <span>Profile</span>
            </a>
          </div>
        </nav>
    </main>
  );
}