"use client";

import * as React from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Star,
  Car,
  Shield,
  Settings,
  Edit,
  Save,
  ArrowLeft,
  Camera,
  Award,
  Heart,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = React.useState(false);
  const [profileData, setProfileData] = React.useState({
    firstName: "Max",
    lastName: "Player",
    email: "max.player@example.com",
    phone: "+91 9876543210",
    bio: "Love traveling and meeting new people through carpooling!",
    location: "Mumbai, Maharashtra",
  });

  const stats = {
    ridesCompleted: 28,
    rating: 4.8,
    moneySaved: 8450,
    co2Saved: 145,
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would save to your backend/Firebase
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-green-800 bg-black">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                className="text-white hover:bg-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-white">Profile</h1>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-900"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-900"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar and Basic Info */}
            <div className="bg-black rounded-lg border border-green-800 p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-24 w-24 ring-4 ring-green-500">
                  <AvatarFallback className="bg-gradient-to-br from-carpool-500 to-carpool-700 text-white text-2xl font-bold">
                    {profileData.firstName[0]}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-green-600 hover:bg-green-700"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={profileData.firstName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            firstName: e.target.value,
                          })
                        }
                        className="bg-gray-900 border-gray-700 text-white text-center"
                      />
                      <Input
                        value={profileData.lastName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            lastName: e.target.value,
                          })
                        }
                        className="bg-gray-900 border-gray-700 text-white text-center"
                      />
                    </div>
                    <Input
                      value={profileData.bio}
                      onChange={(e) =>
                        setProfileData({ ...profileData, bio: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700 text-white text-center"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {profileData.firstName} {profileData.lastName}
                    </h2>
                    <p className="text-gray-400 mt-2">{profileData.bio}</p>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <span className="font-semibold">{stats.rating}</span>
                  </div>
                  <Badge className="bg-green-900 text-green-300 border-green-700">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-black rounded-lg border border-green-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-400" />
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {isEditing ? (
                    <Input
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      className="bg-gray-900 border-gray-700 text-white flex-1"
                    />
                  ) : (
                    <span className="text-gray-300">{profileData.email}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {isEditing ? (
                    <Input
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="bg-gray-900 border-gray-700 text-white flex-1"
                    />
                  ) : (
                    <span className="text-gray-300">{profileData.phone}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {isEditing ? (
                    <Input
                      value={profileData.location}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          location: e.target.value,
                        })
                      }
                      className="bg-gray-900 border-gray-700 text-white flex-1"
                    />
                  ) : (
                    <span className="text-gray-300">
                      {profileData.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black border-green-800">
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Car className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {stats.ridesCompleted}
                      </p>
                      <p className="text-sm text-gray-400">Rides Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black border-green-800">
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Star className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {stats.rating}
                      </p>
                      <p className="text-sm text-gray-400">Average Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black border-green-800">
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <DollarSign className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        ₹{stats.moneySaved}
                      </p>
                      <p className="text-sm text-gray-400">Money Saved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black border-green-800">
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <Heart className="h-8 w-8 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {stats.co2Saved}kg
                      </p>
                      <p className="text-sm text-gray-400">CO₂ Saved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-black border-green-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Award className="h-5 w-5 mr-2 text-green-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: "ride",
                      title: "Completed ride to Pune",
                      time: "2 hours ago",
                      rating: 5,
                    },
                    {
                      type: "review",
                      title: "Received 5-star review from Priya",
                      time: "1 day ago",
                      rating: 5,
                    },
                    {
                      type: "ride",
                      title: "Created ride to Goa",
                      time: "3 days ago",
                      rating: null,
                    },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-900"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-900">
                          {activity.type === "ride" ? (
                            <Car className="h-4 w-4 text-green-400" />
                          ) : (
                            <Star className="h-4 w-4 text-yellow-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {activity.title}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      {activity.rating && (
                        <div className="flex items-center text-yellow-500">
                          {[...Array(activity.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="bg-black border-green-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-green-400" />
                  Ride Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "No Smoking", enabled: true },
                    { label: "Music OK", enabled: true },
                    { label: "Pet Friendly", enabled: false },
                    { label: "Quiet Ride", enabled: false },
                  ].map((pref, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        pref.enabled
                          ? "border-green-600 bg-green-900/20"
                          : "border-gray-700 bg-gray-900"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          pref.enabled ? "text-green-300" : "text-gray-400"
                        }`}
                      >
                        {pref.label}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
