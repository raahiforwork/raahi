"use client";

import * as React from "react";
import {
  ArrowRight,
  Play,
  Star,
  MapPin,
  Users,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Hero() {
  const [mounted, setMounted] = React.useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (user) {
      router.push("/dashboard/find");
    } else {
      router.push("/login");
    }
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="relative min-h-screen flex items-center gradient-bg overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-carpool-500/10 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-carpool-600/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-carpool-400/10 rounded-full blur-xl"></div>
      </div>

      <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center py-20">
        {/* Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit px-4 py-2">
              <Star className="w-4 h-4 mr-2 fill-current text-yellow-500" />
              Bennett Exclusive
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Share the <span className="gradient-text">Journey</span>,{" "}
              <br className="hidden md:block" />
              Save the <span className="gradient-text">Planet</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Carpool with fellow Bennett students and staff. Save fuel, reduce
              traffic, and make new friends on every ride.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={handleClick}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
            >
              <span className="flex items-center">
                Find a Ride
                <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">1.2K+</span>
              </div>
              <p className="text-sm text-muted-foreground">Bennett Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">25+</span>
              </div>
              <p className="text-sm text-muted-foreground">Ride Routes</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">₹50K+</span>
              </div>
              <p className="text-sm text-muted-foreground">Saved by Students</p>
            </div>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative">
          <div className="relative">
            <div className="glass-effect rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-carpool-500 to-carpool-600 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Today&apos;s Ride</h3>
                    <p className="text-sm text-muted-foreground">
                      Bennett → Greater Noida
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Departure</span>
                    <span className="font-medium">8:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Available Seats</span>
                    <span className="font-medium text-carpool-600">2/4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost per person</span>
                    <span className="font-bold text-carpool-600">₹100</span>
                  </div>
                </div>

                <Button className="w-full mt-6 bg-carpool-600 hover:bg-carpool-700">
                  <Link href="/login" className="flex items-center">
                    Join Ride
                  </Link>
                </Button>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-carpool-500 text-white rounded-full p-3 shadow-lg animate-bounce">
              <Star className="h-5 w-5 fill-current" />
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
              <MapPin className="h-5 w-5 text-carpool-600" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
