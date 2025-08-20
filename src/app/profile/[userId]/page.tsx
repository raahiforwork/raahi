"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Star,
  Car,
  Users,
  Trophy,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import InnerNavbar from "@/components/InnerNavbar";
import { toast } from "sonner";
import { Nunito } from "next/font/google";
import { useTravelStats } from '@/hooks/useTravelStats';

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  joinedDate?: string;
  totalRides?: number;
  completedRides?: number;
  rating?: number;
  preferences?: string[];
  vehicleInfo?: {
    make?: string;
    model?: string;
    year?: string;
    color?: string;
    plateNumber?: string;
  };
};

const UserProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.userId as string;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const travelStats = useTravelStats(currentUser?.uid || '');
  const [loading, setLoading] = useState(true);
  const [ridesCreated, setRidesCreated] = useState(0);
  const [ridesJoined, setRidesJoined] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            bio: userData.bio || "",
            joinedDate: userData.createdAt?.toDate?.().toLocaleDateString() || "Recently",
            rating: userData.rating || 0,
            preferences: userData.preferences || [],
            vehicleInfo: userData.vehicleInfo || {},
          });
        } else {
          toast.error("User profile not found");
          router.back();
          return;
        }

        const ridesQuery = query(
          collection(db, "Rides"),
          where("userId", "==", userId)
        );
        const ridesSnapshot = await getDocs(ridesQuery);
        setRidesCreated(ridesSnapshot.size);

        const bookingsQuery = query(
          collection(db, "bookings"),
          where("userId", "==", userId),
          where("status", "==", "active")
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        setRidesJoined(bookingsSnapshot.size);

      } catch (error) {
        console.log(error);
        toast.error("Failed to load user profile");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, router]);

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 ${nunito.className}`}>
        <InnerNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 ${nunito.className}`}>
        <InnerNavbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${userProfile.firstName} ${userProfile.lastName}`.trim() || "Anonymous User";
  const isOwnProfile = currentUser?.uid === userId;

return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 ${nunito.className}`}>
      {/* Background decorative elements - Responsive */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-96 md:h-96 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 md:w-96 md:h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <InnerNavbar />

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-3 sm:py-6 md:py-8 mt-12 sm:mt-16 md:mt-20">
        {/* Header - Responsive */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white text-sm px-2 py-1 sm:px-3 sm:py-2"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Back</span>
          </Button>
          
          {isOwnProfile && (
            <Button
              onClick={() => router.push("/dashboard?tab=profile")}
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
            >
              <span className="hidden xs:inline">Edit Profile</span>
              <span className="xs:hidden">Edit</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-green-800/20 shadow-xl">
              <CardContent className="p-3 sm:p-4 md:p-6">
                {/* Profile Avatar & Basic Info */}
                <div className="text-center mb-4 sm:mb-6">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto mb-3 sm:mb-4 ring-2 sm:ring-4 ring-green-500/30">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-base sm:text-xl md:text-2xl font-bold">
                      {fullName.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 px-2 break-words">
                    {fullName}
                  </h1>
                  {userProfile.bio && (
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed px-2 break-words">
                      {userProfile.bio}
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-xs sm:text-sm break-all flex-1 min-w-0">
                      {userProfile.email}
                    </span>
                  </div>
                  {userProfile.phone && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-xs sm:text-sm break-all">
                        {userProfile.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0" />
                    <span className="text-gray-300 text-xs sm:text-sm">
                      Joined {userProfile.joinedDate}
                    </span>
                  </div>
                </div>

                
              </CardContent>
            </Card>
          </div>

          {/* Stats & Vehicle Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Travel Stats - Now Dynamic */}
            <Card className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-green-800/20 shadow-xl">
              <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
                <CardTitle className="text-white flex items-center text-sm sm:text-base md:text-lg">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-yellow-400" />
                  Travel Statistics
                  {travelStats.loading && (
                    <div className="ml-2 animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-yellow-400"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                {travelStats.loading ? (
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="text-center p-2 sm:p-3 md:p-4 bg-gray-700/30 rounded-lg sm:rounded-xl border border-gray-600/20 animate-pulse">
                        <div className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 bg-gray-600 rounded mx-auto mb-1 sm:mb-2"></div>
                        <div className="h-6 sm:h-7 md:h-8 bg-gray-600 rounded mb-1"></div>
                        <div className="h-3 sm:h-4 bg-gray-600 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    <div className="text-center p-2 sm:p-3 md:p-4 bg-blue-500/10 rounded-lg sm:rounded-xl border border-blue-500/20">
                      <Car className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-400 mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                        {travelStats.ridesCreated}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 leading-tight">
                        Rides Created
                      </div>
                    </div>
                    <div className="text-center p-2 sm:p-3 md:p-4 bg-green-500/10 rounded-lg sm:rounded-xl border border-green-500/20">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-400 mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                        {travelStats.ridesJoined}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 leading-tight">
                        Rides Joined
                      </div>
                    </div>
                    <div className="text-center p-2 sm:p-3 md:p-4 bg-purple-500/10 rounded-lg sm:rounded-xl border border-purple-500/20 xs:col-span-2 md:col-span-1">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-purple-400 mx-auto mb-1 sm:mb-2" />
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                        {travelStats.totalTrips}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 leading-tight">
                        Total Trips
                      </div>
                    </div>
                  </div>
                )}

              
                {!travelStats.loading && (travelStats.activeTrips > 0 || travelStats.completedTrips > 0) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4">
                   
                    {travelStats.completedTrips > 0 && (
                      <div className="text-center p-2 sm:p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                        <div className="text-sm sm:text-base font-bold text-green-400">
                          {travelStats.completedTrips}
                        </div>
                        <div className="text-xs text-gray-400">Completed</div>
                      </div>
                    )}
                    {travelStats.cancelledTrips > 0 && (
                      <div className="text-center p-2 sm:p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                        <div className="text-sm sm:text-base font-bold text-red-400">
                          {travelStats.cancelledTrips}
                        </div>
                        <div className="text-xs text-gray-400">Cancelled</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Travel Preferences */}
            {userProfile.preferences && userProfile.preferences.length > 0 && (
              <Card className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-green-800/20 shadow-xl">
                <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
                  <CardTitle className="text-white flex items-center text-sm sm:text-base md:text-lg">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-green-400" />
                    Travel Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {userProfile.preferences.map((pref, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-green-500/30 bg-green-500/10 text-green-300 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
                      >
                        {pref}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;