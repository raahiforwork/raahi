"use client";

import * as React from "react";
import { Search, Users, MapPin, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Find Your Ride",
    description:
      "Enter your start and destination points. Our smart algorithm will find the perfect matches for your route and schedule.",
    color: "from-carpool-500 to-carpool-600",
  },
  {
    step: "02",
    icon: Users,
    title: "Connect & Chat",
    description:
      "Browse available rides and drivers. Chat with potential carpool partners to ensure a good fit before booking.",
    color: "from-blue-500 to-blue-600",
  },
  {
    step: "03",
    icon: MapPin,
    title: "Share the Journey",
    description:
      "Meet at the agreed pickup point and enjoy your shared journey. Split the costs and reduce your environmental impact.",
    color: "from-purple-500 to-purple-600",
  },
  {
    step: "04",
    icon: CheckCircle,
    title: "Rate & Repeat",
    description:
      "Rate your experience and build your reputation. Schedule regular carpools with trusted partners for hassle-free commuting.",
    color: "from-green-500 to-green-600",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Simple Process
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            How <span className="gradient-text">Raahi</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting started is simple. Follow these four easy steps to begin
            your sustainable commuting journey today.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6 group">
                <div className="flex-shrink-0">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs font-mono">
                      {step.step}
                    </Badge>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Visual representation */}
          <div className="relative">
            <Card className="p-8 bg-gradient-to-br from-carpool-50 to-white dark:from-gray-900 dark:to-black border-2 border-carpool-200 dark:border-carpool-800">
              <CardContent className="p-0">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-carpool-500 to-carpool-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      Join the Movement
                    </h3>
                    <p className="text-muted-foreground">
                      Be part of the sustainable transportation revolution
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-carpool-200 dark:border-carpool-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-carpool-600">
                        75%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cost Savings
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-carpool-600">
                        60%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        CO₂ Reduction
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-carpool-600">
                        10K+
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Happy Users
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-carpool-600">
                        50+
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cities
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-carpool-500 rounded-full animate-bounce"></div>
            <div className="absolute top-1/2 -left-6 w-4 h-4 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
