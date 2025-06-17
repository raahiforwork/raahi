"use client";

import * as React from "react";
import {
  TrendingUp,
  Users,
  MapPin,
  DollarSign,
  Leaf,
  Clock,
} from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Active Users",
    description: "Join our growing community",
  },
  {
    icon: MapPin,
    value: "50+",
    label: "Cities",
    description: "Across the country",
  },
  {
    icon: DollarSign,
    value: "$2M+",
    label: "Money Saved",
    description: "By our community",
  },
  {
    icon: Leaf,
    value: "500T",
    label: "CO₂ Reduced",
    description: "Environmental impact",
  },
  {
    icon: Clock,
    value: "99.9%",
    label: "On-Time Rate",
    description: "Reliable transportation",
  },
  {
    icon: TrendingUp,
    value: "4.9/5",
    label: "User Rating",
    description: "Customer satisfaction",
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
            Numbers That{" "}
            <span className="bg-gradient-to-r from-carpool-400 to-white bg-clip-text text-transparent">
              Matter
            </span>
          </h2>
          <p className="text-lg text-carpool-200 max-w-2xl mx-auto">
            See the positive impact our community is making on wallets,
            environment, and lives every single day.
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
                1.2M
              </div>
              <div className="text-carpool-300">Miles Shared</div>
              <div className="text-sm text-carpool-500 mt-1">
                Equivalent to 48 trips around Earth
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-carpool-400 mb-2">
                15K
              </div>
              <div className="text-carpool-300">Trees Saved</div>
              <div className="text-sm text-carpool-500 mt-1">
                Through reduced emissions
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-carpool-400 mb-2">
                95%
              </div>
              <div className="text-carpool-300">Would Recommend</div>
              <div className="text-sm text-carpool-500 mt-1">
                To friends and family
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
