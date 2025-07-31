import { useAuth } from "@/context/AuthContext";
import {
  Car,
  MapPin,
  Users,
  Star,
  Calendar,
  Clock,
  Loader,
  AlertTriangle,
  Navigation,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function WelcomeBanner() {
  const { userProfile } = useAuth();
  const [location, setLocation] = useState("Click to get location");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState("prompt");

  const getCurrentLocationWithCityName = async () => {
    try {
      setIsLoadingLocation(true);

      if (!navigator.geolocation) {
        setLocation("GPS not supported");
        setIsLoadingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
            );

            if (response.ok) {
              const data = await response.json();
              const address = data.address;

              const city =
                address.city ||
                address.town ||
                address.village ||
                address.municipality ||
                address.county ||
                "Unknown City";

              const state =
                address.state || address.region || address.province || "";

              const country = address.country || "Unknown Country";

              if (state && state !== city) {
                setLocation(`${city}, ${state}`);
              } else {
                setLocation(`${city}, ${country}`);
              }
              setLocationPermission("granted");
            } else {
              setLocation("Location unavailable");
            }
          } catch (error) {
            console.error("Error fetching location name:", error);
            setLocation("Location unavailable");
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Geolocation error code:", error.code);
          console.error("Geolocation error message:", error.message);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationPermission("denied");
              setLocation("Location access denied");
              break;
            case error.POSITION_UNAVAILABLE:
              setLocation("Location unavailable");
              break;
            case error.TIMEOUT:
              setLocation("Location request timeout");
              break;
            default:
              setLocation("Location error");
              break;
          }
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    } catch (error) {
      console.error("Location fetch error:", error);
      setLocation("Location error");
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setLocationPermission(result.state);
        if (result.state === "granted") {
          getCurrentLocationWithCityName();
        }
      });
    }
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/10 to-purple-900/20 rounded-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl animate-pulse delay-1000" />

      <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-3xl border border-green-800/30 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                {userProfile?.firstName || "Traveler"}
              </span>
              !
            </h2>
            <div className="flex items-center justify-center space-x-2 text-2xl"></div>
          </div>

          <p className="text-gray-300 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            Ready for your next adventure? Find rides, share journeys, and
            connect with fellow travelers.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="flex items-center space-x-2 text-gray-300 bg-gray-800/30 px-4 py-2 rounded-full border border-gray-700/30">
            <Calendar className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-gray-300 bg-gray-800/30 px-4 py-2 rounded-full border border-gray-700/30">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div
            className="flex items-center space-x-2 text-gray-300 bg-gray-800/30 px-4 py-2 rounded-full border border-gray-700/30 cursor-pointer hover:bg-gray-700/30 hover:border-gray-600/50 transition-all duration-300"
            onClick={() => {
              if (locationPermission !== "granted") {
                getCurrentLocationWithCityName();
              }
            }}
          >
            {isLoadingLocation ? (
              <Loader className="h-4 w-4 text-purple-400 animate-spin" />
            ) : locationPermission === "denied" ? (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            ) : locationPermission === "granted" ? (
              <Navigation className="h-4 w-4 text-green-400" />
            ) : (
              <MapPin className="h-4 w-4 text-purple-400" />
            )}

            <span className="text-sm font-medium">{location}</span>
          </div>
        </div>

        {locationPermission === "prompt" && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-xs">
              Click on location to share your precise position
            </p>
          </div>
        )}

        {locationPermission === "denied" && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-xs">
              Location access denied. Enable in browser settings to see your
              precise location.
            </p>
          </div>
        )}

        {locationPermission === "granted" && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-1 bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30 text-xs">
              <Navigation className="h-3 w-3" />
              <span>Precise GPS Location </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
