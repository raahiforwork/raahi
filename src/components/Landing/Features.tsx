"use client";

import * as React from "react";
import {
  Shield,
  DollarSign,
  Leaf,
  Users,
  MapPin,
  Clock,
  Star,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: DollarSign,
    title: "Save Money",
    description:
      "Cut your commuting costs by up to 75% by sharing rides with other travelers going your way.",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    icon: Leaf,
    title: "Eco-Friendly",
    description:
      "Reduce your carbon footprint and help create a more sustainable future for everyone.",
    color: "text-carpool-600",
    bgColor: "bg-carpool-100 dark:bg-carpool-900/20",
  },
  {
    icon: Users,
    title: "Meet People",
    description:
      "Connect with like-minded commuters and build lasting friendships on your daily journey.",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "All users are verified with background checks and real-time tracking for your safety.",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    icon: MapPin,
    title: "Smart Matching",
    description:
      "Our AI-powered algorithm finds the perfect carpool matches based on your route and schedule.",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    icon: Clock,
    title: "Flexible Timing",
    description:
      "Set your own schedule and find rides that fit perfectly with your daily routine.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
  },
];

// Reusable stat box
const StatCard = ({
  icon: Icon,
  value,
  label,
  iconClass,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  iconClass: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-center">
      <Icon className={`h-5 w-5 ${iconClass} mr-2`} aria-hidden="true" />
      <span className="text-2xl font-bold">{value}</span>
    </div>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default function Features() {
  return (
    <section id="features" className="py-24 bg-muted/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Why Choose <span className="gradient-text">Raahi</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of commuters who have already transformed their daily
            journey into something more meaningful, sustainable, and affordable.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="transition-transform hover:scale-[1.03] hover:shadow-lg border-0 shadow-md"
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
                >
                  <feature.icon
                    className={`h-6 w-6 ${feature.color}`}
                    aria-hidden="true"
                  />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            
            <StatCard
              icon={Smartphone}
              value="99%"
              label="Uptime"
              iconClass="text-primary"
            />
            <StatCard
              icon={Shield}
              value="100%"
              label="Verified Users"
              iconClass="text-green-600"
            />
            <StatCard
              icon={Clock}
              value="24/7"
              label="Support"
              iconClass="text-blue-600"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
