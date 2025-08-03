"use client";

import * as React from "react";
import { ArrowRight, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function CTA() {
  const [mounted, setMounted] = React.useState(false);
  // Same logic as your InstallButton component
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Don't show the entire CTA section if already installed
  if (isInstalled) return null;

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
                Join fellow Bennett students and staff to save money, reduce your carbon footprint, and commute smarter together.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-carpool-600" />
                </div>
                <span className="text-carpool-100">
                  Free to join using your Bennett ID
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-carpool-600" />
                </div>
                <span className="text-carpool-100">
                  Verified users within Bennett only
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-carpool-600" />
                </div>
                <span className="text-carpool-100">
                  Connect on a trusted university network
                </span>
              </div>
            </div>

            {/* Install Button - Only shows if installable */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-carpool-700 hover:bg-carpool-50 text-lg px-8 py-6"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              {/* Only show install button if installable */}
              {isInstallable && (
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-carpool-700 text-lg px-8 py-6"
                  onClick={handleInstallClick}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Install App
                </Button>
              )}
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
                      Install for the best experience
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Progressive Web App
                      </span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 bg-yellow-400 rounded-full"
                          ></div>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">5.0</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">
                        Works Offline
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

                    {/* Only show install button if installable */}
                    {isInstallable && (
                      <Button 
                        className="w-full bg-carpool-600 hover:bg-carpool-700 text-white"
                        onClick={handleInstallClick}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Install Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {mounted && (
              <>
                <div className="absolute -top-6 -left-6 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-bounce">
                  Bennett Trusted
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white text-carpool-700 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  500+ Rides Shared
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
