"use client";

import * as React from "react";
import {
  Users,
  MapPin,
  DollarSign,
  Leaf,
  Clock,
  Star,
} from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "750+",
    label: "Verified Students",
    description: "Active on Raahi from Bennett",
  },
  {
    icon: MapPin,
    value: "20+",
    label: "Routes Covered",
    description: "To Delhi NCR, Agra, Meerut & more",
  },
  {
    icon: DollarSign,
    value: "₹1.5L+",
    label: "Saved in Fuel",
    description: "By sharing rides within campus community",
  },
  {
    icon: Leaf,
    value: "1.2T",
    label: "CO₂ Saved",
    description: "By reducing solo trips",
  },
  {
    icon: Clock,
    value: "97%",
    label: "On-Time Matches",
    description: "Coordinated, dependable rides",
  },
  {
    icon: Star,
    value: "4.8/5",
    label: "Student Rating",
    description: "Based on peer feedback",
  },
];

export default function Stats() {
  return (
    <section className="py-24 bg-carpool-950 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-carpool-500 to-carpool-700"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-carpool-400 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Raahi’s Impact at{" "}
            <span className="bg-gradient-to-r from-carpool-400 to-white bg-clip-text text-transparent">
              Bennett University
            </span>
          </h2>
          <p className="text-lg text-carpool-200 max-w-2xl mx-auto">
            Discover how Raahi is making commuting smarter, greener, and more affordable — just for Bennett students.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="mb-4">
                <div className="w-16 h-16 bg-carpool-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-carpool-500/30 transition-colors">
                  <stat.icon className="h-8 w-8 text-carpool-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2 text-white">
                  {stat.value}
                </div>
                <div className="text-carpool-300 font-medium mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-carpool-400">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional impact metrics */}
        <div className="mt-16 pt-16 border-t border-carpool-800">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-carpool-400 mb-2">
                18K+
              </div>
              <div className="text-carpool-300">KM Shared</div>
              <div className="text-sm text-carpool-500 mt-1">
                From hostels to home, every weekend
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-carpool-400 mb-2">
                320+
              </div>
              <div className="text-carpool-300">Trips Scheduled</div>
              <div className="text-sm text-carpool-500 mt-1">
                With verified student profiles
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-carpool-400 mb-2">
                93%
              </div>
              <div className="text-carpool-300">Would Recommend</div>
              <div className="text-sm text-carpool-500 mt-1">
                To fellow Bennett friends
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
