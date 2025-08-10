import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Shield, Star, MessageCircle, Activity, Car, Users, Clock, Trophy } from "lucide-react";
import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
} from "firebase/firestore";

interface UserProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isVerified: boolean;
  createdAt: any;
}

interface TravelStats {
  ridesCreated: number;
  ridesJoined: number;
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  cancelledTrips: number;
  loading: boolean;
}

// Custom hook for travel statistics
const useTravelStats = (userId: string | undefined): TravelStats => {
  const [stats, setStats] = useState<TravelStats>({
    ridesCreated: 0,
    ridesJoined: 0,
    totalTrips: 0,
    completedTrips: 0,
    activeTrips: 0,
    cancelledTrips: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchTravelStats = async () => {
      if (!userId) {
        setStats(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Fetch bookings (rides joined)
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("userId", "==", userId)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);

        // Fetch created rides
        const createdRidesQuery = query(
          collection(db, "Rides"),
          where("userId", "==", userId)
        );
        const createdRidesSnapshot = await getDocs(createdRidesQuery);

        // Calculate stats from bookings
        let joinedActive = 0;
        let joinedCompleted = 0;
        let joinedCancelled = 0;

        bookingsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const status = data.status || 'active';
          
          switch (status.toLowerCase()) {
            case 'completed':
              joinedCompleted++;
              break;
            case 'cancelled':
            case 'left':
              joinedCancelled++;
              break;
            case 'active':
            default:
              joinedActive++;
              break;
          }
        });

     
        let createdActive = 0;
        let createdCompleted = 0;
        let createdCancelled = 0;

        createdRidesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const status = data.status || 'active';
          
          switch (status.toLowerCase()) {
            case 'completed':
              createdCompleted++;
              break;
            case 'cancelled':
              createdCancelled++;
              break;
            case 'active':
            default:
              createdActive++;
              break;
          }
        });

        const ridesCreated = createdRidesSnapshot.docs.length;
        const ridesJoined = bookingsSnapshot.docs.length;

        setStats({
          ridesCreated,
          ridesJoined,
          totalTrips: ridesCreated + ridesJoined,
          completedTrips: createdCompleted + joinedCompleted,
          activeTrips: createdActive + joinedActive,
          cancelledTrips: createdCancelled + joinedCancelled,
          loading: false,
        });

      } catch (error) {
        console.error("Error fetching travel stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTravelStats();
  }, [userId]);

  return stats;
};

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const travelStats = useTravelStats(user?.uid);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserProfileData;
          setUserProfile(data);
          setEditData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: data.phone || "",
          });
        } else {
          console.log("No user profile found");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !userProfile) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        firstName: editData.firstName.trim(),
        lastName: editData.lastName.trim(),
        phone: editData.phone.trim(),
      });

      setUserProfile({
        ...userProfile,
        firstName: editData.firstName.trim(),
        lastName: editData.lastName.trim(),
        phone: editData.phone.trim(),
      });

      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      firstName: userProfile?.firstName || "",
      lastName: userProfile?.lastName || "",
      phone: userProfile?.phone || "",
    });
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-6 mt-6 lg:p-8">
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-orange-800/20 p-4 sm:p-6 lg:p-8 shadow-xl">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="p-3 sm:p-6 mt-6 lg:p-8">
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-orange-800/20 p-4 sm:p-6 lg:p-8 shadow-xl">
          <p className="text-gray-400">No profile data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 mt-6 lg:p-6 xl:p-8">
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-orange-800/20 p-3 sm:p-4 lg:p-6 xl:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:mb-6 lg:mb-8">
          <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg sm:rounded-xl shadow-lg mb-3 sm:mb-0">
            <User className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
          </div>
          <div className="sm:ml-4">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
              Your Profile
            </h3>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">
              Manage your account and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Profile Info */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-4 p-3 sm:p-4 lg:p-6 bg-gray-900/50 rounded-lg sm:rounded-xl border border-gray-700/30">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 ring-2 sm:ring-4 ring-orange-500/30 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm sm:text-lg lg:text-xl font-bold">
                  {userProfile.firstName?.[0] || ""}
                  {userProfile.lastName?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {userProfile.firstName} {userProfile.lastName}
                </h4>
                <p className="text-gray-400 mt-1 sm:mt-1 text-xs sm:text-sm lg:text-base break-all sm:break-normal">
                  {userProfile.email}
                </p>
                <p className="mt-1 sm:mt-1 text-gray-400 text-sm sm:text-base font-medium">
                  Phone: {userProfile.phone || "No phone number"}
                </p>
              </div>
            </div>

            {/* Enhanced Travel Statistics */}
            <div className="space-y-3 sm:space-y-4">
              <h5 className="text-base sm:text-lg font-semibold text-white flex items-center">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-yellow-400" />
                Travel Statistics
                {travelStats.loading && (
                  <div className="ml-2 animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-yellow-400"></div>
                )}
              </h5>
              
              {travelStats.loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="text-center p-3 sm:p-4 bg-gray-800/30 rounded-lg sm:rounded-xl animate-pulse">
                      <div className="h-4 sm:h-6 w-6 sm:w-8 bg-gray-700 rounded mx-auto mb-1 sm:mb-2"></div>
                      <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-700 rounded mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Main Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div className="text-center p-3 sm:p-4 bg-blue-500/10 rounded-lg sm:rounded-xl border border-blue-500/20">
                      <Car className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mx-auto mb-1 sm:mb-2" />
                      <p className="text-lg sm:text-2xl font-bold text-blue-400">
                        {travelStats.ridesCreated}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Created
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-green-500/10 rounded-lg sm:rounded-xl border border-green-500/20">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mx-auto mb-1 sm:mb-2" />
                      <p className="text-lg sm:text-2xl font-bold text-green-400">
                        {travelStats.ridesJoined}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Joined
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-purple-500/10 rounded-lg sm:rounded-xl border border-purple-500/20 col-span-2 sm:col-span-1">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 mx-auto mb-1 sm:mb-2" />
                      <p className="text-lg sm:text-2xl font-bold text-purple-400">
                        {travelStats.totalTrips}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Total Trips
                      </p>
                    </div>
                  </div>

                 
                </>
              )}
            </div>

            {/* Editable Fields - Only show when in edit mode */}
            {editMode && (
              <div className="space-y-3 sm:space-y-4">
                <h5 className="text-base sm:text-lg font-semibold text-white">
                  Edit Profile
                </h5>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-orange-400 mb-1 sm:mb-2 block">
                    First Name
                  </label>
                  <Input
                    value={editData.firstName}
                    onChange={(e) =>
                      setEditData({ ...editData, firstName: e.target.value })
                    }
                    className="bg-gray-800/50 border-gray-600/50 text-white text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-orange-400 mb-1 sm:mb-2 block">
                    Last Name
                  </label>
                  <Input
                    value={editData.lastName}
                    onChange={(e) =>
                      setEditData({ ...editData, lastName: e.target.value })
                    }
                    className="bg-gray-800/50 border-gray-600/50 text-white text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-orange-400 mb-1 sm:mb-2 block">
                    Phone Number
                  </label>
                  <Input
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    className="bg-gray-800/50 border-gray-600/50 text-white text-sm sm:text-base py-2 sm:py-3"
                    placeholder="Enter phone number"
                    type="tel"
                  />
                </div>
                <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 text-sm sm:text-base flex-1"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 py-2 px-4 text-sm sm:text-base flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Settings & Actions */}
          <div className="space-y-4 sm:space-y-6">
            <h5 className="text-base sm:text-lg font-semibold text-white">
              Settings & Actions
            </h5>

            <div className="space-y-2 sm:space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white py-2 sm:py-3 text-sm sm:text-base"
                onClick={() => setEditMode(true)}
                disabled={editMode}
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
