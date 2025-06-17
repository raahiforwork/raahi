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

export default function Hero() {
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
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit px-4 py-2">
              <Star className="w-4 h-4 mr-2 fill-current text-yellow-500" />
              Trusted by 10,000+ commuters
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Share the <span className="gradient-text">Journey</span>,{" "}
              <br className="hidden md:block" />
              Save the <span className="gradient-text">Planet</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              Connect with fellow commuters in your area. Make your daily
              journey more sustainable, affordable, and social with CarPool
              Connect.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
            >
              Find a Ride
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">10K+</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">50+</span>
              </div>
              <p className="text-sm text-muted-foreground">Cities</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-primary mr-2" />
                <span className="text-2xl font-bold">$2M+</span>
              </div>
              <p className="text-sm text-muted-foreground">Money Saved</p>
            </div>
          </div>
        </div>

        {/* Hero Image/Animation */}
        <div className="relative animate-slide-in">
          <div className="relative">
            {/* Main card */}
            <div className="glass-effect rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-carpool-500 to-carpool-600 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Today&apos;s Carpool</h3>
                    <p className="text-sm text-muted-foreground">
                      Downtown → Tech Park
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Departure</span>
                    <span className="font-medium">8:30 AM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Available Seats</span>
                    <span className="font-medium text-carpool-600">3/4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost per person</span>
                    <span className="font-bold text-carpool-600">$8</span>
                  </div>
                </div>

                <Button className="w-full mt-6 bg-carpool-600 hover:bg-carpool-700">
                  Join Ride
                </Button>
              </div>
            </div>

            {/* Floating elements */}
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
