"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Users,
  Star,
  Clock,
  DollarSign,
  Car,
  Locate,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RideMapProps {
  rides: any[];
  onRideSelect?: (ride: any) => void;
  selectedRide?: any;
}

interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  type: "pickup" | "destination" | "driver";
  ride?: any;
  title: string;
}

export function RideMap({ rides, onRideSelect, selectedRide }: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [routes, setRoutes] = useState<google.maps.Polyline[]>([]);
  const [animationInterval, setAnimationInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Mock coordinates for Indian cities
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    "mumbai central": { lat: 19.0176, lng: 72.8562 },
    bandra: { lat: 19.0596, lng: 72.8295 },
    andheri: { lat: 19.1136, lng: 72.8697 },
    pune: { lat: 18.5204, lng: 73.8567 },
    "pune station": { lat: 18.5279, lng: 73.8723 },
    "connaught place": { lat: 28.6315, lng: 77.2167 },
    "karol bagh": { lat: 28.6519, lng: 77.1909 },
    dwarka: { lat: 28.5921, lng: 77.046 },
    "gurgaon cyber city": { lat: 28.495, lng: 77.089 },
    "noida sector 62": { lat: 28.6241, lng: 77.3647 },
    nashik: { lat: 19.9975, lng: 73.7898 },
    lonavala: { lat: 18.7537, lng: 73.4063 },
  };

  const getCoordinates = (location: string) => {
    const key = location.toLowerCase();
    return (
      cityCoordinates[key] ||
      cityCoordinates[
        Object.keys(cityCoordinates).find((k) =>
          k.includes(key.split(" ")[0]),
        ) || ""
      ] || { lat: 19.076, lng: 72.8777 } // Default to Mumbai
    );
  };

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 19.076, lng: 72.8777 }, // Mumbai center
        zoom: 10,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#1f2937" }],
          },
          {
            featureType: "all",
            elementType: "labels.text.stroke",
            stylers: [{ lightness: -80 }],
          },
          {
            featureType: "administrative",
            elementType: "labels.text.fill",
            stylers: [{ color: "#22c55e" }],
          },
          {
            featureType: "poi",
            elementType: "all",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#374151" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca3af" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#0f172a" }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: false,
      });

      setMapInstance(map);

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(userPos);
            map.setCenter(userPos);
          },
          () => {
            // Fallback to Mumbai if geolocation fails
            console.log("Geolocation failed, using default location");
          },
        );
      }
    }
  }, [mapRef.current]);

  // Animate route drawing
  const animateRouteDrawing = (
    polyline: google.maps.Polyline,
    duration: number = 2000,
  ) => {
    const path = polyline.getPath();
    const originalPath = path.getArray();
    polyline.setPath([]);

    let step = 0;
    const steps = 50;
    const stepDuration = duration / steps;

    const animationTimer = setInterval(() => {
      if (step <= steps) {
        const progress = step / steps;
        const pointsToShow = Math.floor(originalPath.length * progress);
        const currentPath = originalPath.slice(0, Math.max(1, pointsToShow));
        polyline.setPath(currentPath);
        step++;
      } else {
        clearInterval(animationTimer);
      }
    }, stepDuration);

    return animationTimer;
  };

  // Create pulsing effect for selected route
  const createPulsingEffect = (polyline: google.maps.Polyline) => {
    let opacity = 0.8;
    let increasing = false;

    const pulseTimer = setInterval(() => {
      if (increasing) {
        opacity += 0.05;
        if (opacity >= 1.0) {
          increasing = false;
        }
      } else {
        opacity -= 0.05;
        if (opacity <= 0.4) {
          increasing = true;
        }
      }
      polyline.setOptions({ strokeOpacity: opacity });
    }, 100);

    return pulseTimer;
  };

  // Update markers and routes when rides change
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing markers and routes
    markers.forEach((marker) => marker.setMap(null));
    routes.forEach((route) => route.setMap(null));
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    setMarkers([]);
    setRoutes([]);

    const newMarkers: google.maps.Marker[] = [];
    const newRoutes: google.maps.Polyline[] = [];

    rides.forEach((ride, index) => {
      const fromCoords = getCoordinates(ride.route.from);
      const toCoords = getCoordinates(ride.route.to);
      const isSelected = selectedRide?.id === ride.id;

      // Enhanced pickup marker with animation
      const pickupMarker = new google.maps.Marker({
        position: fromCoords,
        map: mapInstance,
        title: `Pickup: ${ride.route.from}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: isSelected ? "#10b981" : "#22c55e",
          fillOpacity: isSelected ? 1 : 0.9,
          strokeColor: "#ffffff",
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 12 : 8,
        },
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      // Enhanced destination marker with animation
      const destMarker = new google.maps.Marker({
        position: toCoords,
        map: mapInstance,
        title: `Destination: ${ride.route.to}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: isSelected ? "#dc2626" : "#ef4444",
          fillOpacity: isSelected ? 1 : 0.9,
          strokeColor: "#ffffff",
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 12 : 8,
        },
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      // Enhanced driver marker
      const driverMarker = new google.maps.Marker({
        position: {
          lat: fromCoords.lat + (Math.random() - 0.5) * 0.01,
          lng: fromCoords.lng + (Math.random() - 0.5) * 0.01,
        },
        map: mapInstance,
        title: `Driver: ${ride.driver.name}`,
        icon: {
          url:
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 40 : 32}" height="${isSelected ? 40 : 32}" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="${isSelected ? "#10b981" : "#22c55e"}" stroke="#ffffff" stroke-width="${isSelected ? 3 : 2}"/>
              <path d="M12 14h8v4h-8z" fill="#ffffff"/>
              <circle cx="14" cy="20" r="2" fill="#ffffff"/>
              <circle cx="18" cy="20" r="2" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(
            isSelected ? 40 : 32,
            isSelected ? 40 : 32,
          ),
        },
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      // Add click listeners
      const addClickListener = (marker: google.maps.Marker) => {
        marker.addListener("click", () => {
          onRideSelect?.(ride);
        });
      };

      addClickListener(pickupMarker);
      addClickListener(destMarker);
      addClickListener(driverMarker);

      newMarkers.push(pickupMarker, destMarker, driverMarker);

      // Create enhanced route with gradient effect
      const routePath = new google.maps.Polyline({
        path: [fromCoords, toCoords],
        geodesic: true,
        strokeColor: isSelected ? "#10b981" : "#6b7280",
        strokeOpacity: isSelected ? 0.9 : 0.6,
        strokeWeight: isSelected ? 8 : 4,
        map: mapInstance,
        icons: isSelected
          ? [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  fillColor: "#10b981",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                  scale: 6,
                },
                offset: "50%",
                repeat: "200px",
              },
              {
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#10b981",
                  fillOpacity: 0.8,
                  strokeColor: "#ffffff",
                  strokeWeight: 1,
                  scale: 3,
                },
                offset: "0%",
                repeat: "50px",
              },
            ]
          : [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  fillColor: "#6b7280",
                  fillOpacity: 0.7,
                  strokeColor: "#ffffff",
                  strokeWeight: 1,
                  scale: 4,
                },
                offset: "50%",
                repeat: "300px",
              },
            ],
      });

      // Add shadow/glow effect for selected route
      if (isSelected) {
        const shadowPath = new google.maps.Polyline({
          path: [fromCoords, toCoords],
          geodesic: true,
          strokeColor: "#10b981",
          strokeOpacity: 0.3,
          strokeWeight: 16,
          map: mapInstance,
          zIndex: 1,
        });
        newRoutes.push(shadowPath);
      }

      routePath.addListener("click", () => {
        onRideSelect?.(ride);
      });

      newRoutes.push(routePath);

      // Animate route drawing for selected route
      if (isSelected) {
        setTimeout(() => {
          animateRouteDrawing(routePath, 1500);
          const pulseTimer = createPulsingEffect(routePath);
          setAnimationInterval(pulseTimer);
        }, 200);
      }
    });

    setMarkers(newMarkers);
    setRoutes(newRoutes);

    // Cleanup function
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [mapInstance, rides, selectedRide]);

  const centerOnUserLocation = () => {
    if (userLocation && mapInstance) {
      mapInstance.setCenter(userLocation);
      mapInstance.setZoom(12);
    }
  };

  const zoomIn = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom()! + 1);
    }
  };

  const zoomOut = () => {
    if (mapInstance) {
      mapInstance.setZoom(mapInstance.getZoom()! - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card className="bg-black border-green-800 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-400" />
              Live Ride Map
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={centerOnUserLocation}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Locate className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={mapRef} className="w-full h-96 bg-gray-900 rounded-b-lg" />
        </CardContent>
      </Card>

      {/* Map Legend */}
      <Card className="bg-black border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">Map Legend</h4>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                <span className="text-sm text-gray-300">Pickup Points</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                <span className="text-sm text-gray-300">Destinations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">Available Drivers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Ride Info */}
      {selectedRide && (
        <Card className="bg-black border-green-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Navigation className="h-5 w-5 mr-2 text-green-400" />
              Selected Ride Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-12 w-12 ring-2 ring-green-500">
                <AvatarFallback className="bg-gradient-to-br from-carpool-500 to-carpool-700 text-white">
                  {selectedRide.driver.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-white">
                  {selectedRide.driver.name}
                </h4>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{selectedRide.driver.rating}</span>
                  <span>•</span>
                  <span>{selectedRide.driver.ridesCompleted} rides</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400">From</p>
                <p className="text-white font-medium">
                  {selectedRide.route.from}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedRide.route.fromTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">To</p>
                <p className="text-white font-medium">
                  {selectedRide.route.to}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedRide.route.toTime}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge className="bg-green-900 text-green-300 border-green-700">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedRide.availableSeats} seats
                </Badge>
                <Badge className="bg-blue-900 text-blue-300 border-blue-700">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedRide.duration}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  ₹{selectedRide.price}
                </div>
                <p className="text-sm text-gray-400">per person</p>
              </div>
            </div>

            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
              Book This Ride
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Wrapper component that loads Google Maps API
export function RideMapWrapper(props: RideMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps API
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "demo-key"}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  if (!isLoaded) {
    return (
      <Card className="bg-black border-green-800">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-white">Loading Map...</p>
        </CardContent>
      </Card>
    );
  }

  return <RideMap {...props} />;
}

export default RideMapWrapper;
