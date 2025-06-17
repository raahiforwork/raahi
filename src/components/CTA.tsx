"use client";

import * as React from "react";
import { ArrowRight, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-carpool-500 via-carpool-600 to-carpool-700"></div>

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-xl"></div>
        <div className="absolute top-32 right-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full blur-xl"></div>
      </div>

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Ready to Transform Your{" "}
                <span className="bg-gradient-to-r from-white to-carpool-200 bg-clip-text text-transparent">
                  Commute?
                </span>
              </h2>
              <p className="text-lg text-carpool-100 max-w-lg">
                Join thousands of commuters who have already started saving
                money, reducing their environmental impact, and building
                meaningful connections.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-carpool-600" />
                </div>
                <span className="text-carpool-100">
                  Free to join and start saving immediately
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-carpool-600" />
                </div>
                <span className="text-carpool-100">
                  Verified users and secure payments
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-carpool-600" />
                </div>
                <span className="text-carpool-100">
                  Available in 50+ cities nationwide
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-carpool-700 hover:bg-carpool-50 text-lg px-8 py-6"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-carpool-700 text-lg px-8 py-6"
              >
                <Download className="mr-2 h-5 w-5" />
                Download App
              </Button>
            </div>
          </div>

          {/* App preview card */}
          <div className="relative">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <CardContent className="p-8">
                <div className="bg-white rounded-xl shadow-2xl p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-carpool-500 to-carpool-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Download Our App
                    </h3>
                    <p className="text-gray-600">
                      Available on iOS and Android
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        iOS App Store
                      </span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 bg-yellow-400 rounded-full"
                          ></div>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">4.9</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Google Play
                      </span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 bg-yellow-400 rounded-full"
                          ></div>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">4.8</span>
                      </div>
                    </div>

                    <Button className="w-full bg-carpool-600 hover:bg-carpool-700 text-white">
                      <Download className="mr-2 h-4 w-4" />
                      Download Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating badges */}
            <div className="absolute -top-6 -left-6 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-bounce">
              #1 Carpool App
            </div>

            <div className="absolute -bottom-6 -right-6 bg-white text-carpool-700 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              10K+ Downloads
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
