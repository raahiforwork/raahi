"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  Fuel,
  Users,
  Calculator,
  Route,
} from "lucide-react";
import { LocationInput } from "@/components/ui/location-input";
import {
  googleMapsService,
  LocationData,
  RouteCalculation,
} from "@/lib/googleMapsService";
import { toast } from "sonner";

interface RouteCalculatorProps {
  onRouteCalculated?: (
    calculation: RouteCalculation,
    from: string,
    to: string,
  ) => void;
  defaultFrom?: string;
  defaultTo?: string;
}

export function RouteCalculator({
  onRouteCalculated,
  defaultFrom = "",
  defaultTo = "",
}: RouteCalculatorProps) {
  const [fromLocation, setFromLocation] = useState(defaultFrom);
  const [toLocation, setToLocation] = useState(defaultTo);
  const [fromData, setFromData] = useState<LocationData | null>(null);
  const [toData, setToData] = useState<LocationData | null>(null);
  const [passengers, setPassengers] = useState(2);
  const [calculation, setCalculation] = useState<RouteCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!fromLocation || !toLocation) {
      toast.error("Please enter both pickup and destination locations");
      return;
    }

    setLoading(true);
    try {
      const routeData = await googleMapsService.calculateRoute(
        fromData || { address: fromLocation },
        toData || { address: toLocation },
      );

      if (routeData) {
        setCalculation(routeData);
        onRouteCalculated?.(routeData, fromLocation, toLocation);
        toast.success("Route calculated successfully!");
      } else {
        toast.error("Could not calculate route. Please try again.");
      }
    } catch (error) {
      toast.error("Error calculating route");
    } finally {
      setLoading(false);
    }
  };

  const pricing = calculation
    ? googleMapsService.getPricingBreakdown(calculation, passengers)
    : null;

  return (
    <Card className="bg-black border-green-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-green-400" />
          Smart Route & Pricing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-green-400 mb-2 block">
              Pickup Location
            </label>
            <LocationInput
              placeholder="Enter pickup location"
              value={fromLocation}
              onChange={(value, data) => {
                setFromLocation(value);
                setFromData(data || null);
              }}
              icon={<MapPin className="h-4 w-4" />}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-400 mb-2 block">
              Destination
            </label>
            <LocationInput
              placeholder="Enter destination"
              value={toLocation}
              onChange={(value, data) => {
                setToLocation(value);
                setToData(data || null);
              }}
              icon={<Navigation className="h-4 w-4" />}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-green-400 mb-2 block">
              Number of Passengers
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setPassengers(num)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    passengers === num
                      ? "border-green-500 bg-green-900 text-green-300"
                      : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600"
                  }`}
                >
                  {num} {num === 1 ? "Person" : "People"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={loading || !fromLocation || !toLocation}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          {loading ? (
            <>
              <Route className="h-4 w-4 mr-2 animate-spin" />
              Calculating Route...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Route & Price
            </>
          )}
        </Button>

        {/* Results */}
        {calculation && pricing && (
          <div className="space-y-4 p-4 bg-gray-900 rounded-lg border border-green-800">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Route className="h-5 w-5 mr-2 text-green-400" />
              Route Details
            </h3>

            {/* Route Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">
                  {calculation.duration.text}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">
                  {calculation.distance.text}
                </span>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-400">Pricing Breakdown</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Fare</span>
                  <span className="text-white">₹{pricing.baseFare}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fuel Cost</span>
                  <span className="text-white">₹{pricing.fuelCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Distance & Time</span>
                  <span className="text-white">₹{pricing.distanceAndTime}</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between font-semibold">
                  <span className="text-white">Total Cost</span>
                  <span className="text-green-400">₹{pricing.totalPrice}</span>
                </div>
              </div>

              {/* Per Person Cost */}
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-400" />
                    <span className="text-green-300 font-medium">
                      Cost per person ({passengers} passengers)
                    </span>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    ₹{pricing.pricePerPerson}
                  </Badge>
                </div>
                {passengers > 1 && (
                  <p className="text-sm text-green-400 mt-2">
                    You save ₹{pricing.savings} by sharing!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
