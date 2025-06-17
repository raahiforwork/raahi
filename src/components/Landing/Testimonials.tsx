"use client";

import * as React from "react";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Marketing Manager",
    company: "Tech Corp",
    image: "/placeholder.svg",
    rating: 5,
    text: "Raahi has transformed my daily commute. I&apos;ve saved over $200 per month and made amazing friends along the way. The app is incredibly user-friendly!",
  },
  {
    name: "Mike Chen",
    role: "Software Engineer",
    company: "StartupXYZ",
    image: "/placeholder.svg",
    rating: 5,
    text: "As someone who cares about the environment, I love that I&apos;m reducing my carbon footprint while saving money. The matching algorithm is spot-on!",
  },
  {
    name: "Emily Rodriguez",
    role: "Consultant",
    company: "Advisory Inc",
    image: "/placeholder.svg",
    rating: 5,
    text: "The safety features give me peace of mind. All drivers are verified, and the real-time tracking keeps my family informed. Highly recommended!",
  },
  {
    name: "David Park",
    role: "Teacher",
    company: "City Schools",
    image: "/placeholder.svg",
    rating: 5,
    text: "I was skeptical at first, but after my first ride, I was hooked. Great conversation, split costs, and helping the planet - what&apos;s not to love?",
  },
  {
    name: "Lisa Thompson",
    role: "Nurse",
    company: "General Hospital",
    image: "/placeholder.svg",
    rating: 5,
    text: "Working night shifts made finding rides difficult until I found Raahi. The 24/7 availability and flexible scheduling are perfect for my needs.",
  },
  {
    name: "James Wilson",
    role: "Sales Director",
    company: "Global Sales",
    image: "/placeholder.svg",
    rating: 5,
    text: "The business networking opportunities alone make this worth it. I&apos;ve connected with professionals from various industries during my commutes.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            What Our <span className="gradient-text">Community</span> Says
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don&apos;t just take our word for it. Here&apos;s what real users
            have to say about their Raahi experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="card-hover border-0 shadow-md relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 text-carpool-500/20">
                <Quote className="h-8 w-8" />
              </div>

              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 text-yellow-500 fill-current"
                    />
                  ))}
                </div>

                <p className="text-muted-foreground mb-6 italic">
                  &quot;{testimonial.text}&quot;
                </p>

                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={testimonial.image}
                      alt={testimonial.name}
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-8 bg-white dark:bg-gray-800 rounded-full px-8 py-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="font-bold text-2xl">4.9</span>
              <span className="text-muted-foreground">average rating</span>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-2xl text-carpool-600">95%</span>
              <span className="text-muted-foreground">would recommend</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
