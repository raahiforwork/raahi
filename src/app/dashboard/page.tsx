"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  FaBell,
  FaCar,
  FaSearch,
  FaArrowRight,
  FaChevronRight,
  FaRoute,
  FaLeaf,
  FaHome,
  FaCheck,
  FaCheckCircle,
  FaCheckDouble,
  FaTimes,
  FaTimesCircle,
  FaCalendarAlt,
  FaClock,
  FaRupeeSign,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaPlus,
  FaUserCircle
} from "react-icons/fa";
import {
  getCurrentUser,
  getUserProfile,
  getActiveRides,
  getUserRides,
  getUserBookings,
  logoutUser,
  onUserProfileChange,
} from "@/lib/firebase";

function formatTime12Hour(timeStr: string | undefined): string {
  if (!timeStr) return "N/A";
  const [hour, minute] = timeStr.split(":");
  if (hour === undefined || minute === undefined) return "N/A";
  let h = parseInt(hour, 10);
  const m = minute.padStart(2, "0");
  if (isNaN(h)) return "N/A";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

type Notification = {
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export default function DashboardPage() {
  // Auth/user state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // UI state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  const [totalRides, setTotalRides] = useState(0);
  const [co2Saved, setCo2Saved] = useState(0);
  const [ridesPercentChange, setRidesPercentChange] = useState(0);
  const [ridesChangeClass, setRidesChangeClass] = useState(
    "bg-gray-100 text-gray-800"
  );

  const [todayRides, setTodayRides] = useState<any[]>([]);
  const [loadingTodayRides, setLoadingTodayRides] = useState(true);

  // Firebase rules warning
  const [showRulesWarning, setShowRulesWarning] = useState(false);

  // Notification badge
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("notifications");
    if (stored) setNotifications(JSON.parse(stored));
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Auth check and user profile
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        if (user) {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          onUserProfileChange(user.uid, setUserProfile);
        }
      } catch (err) {
        setCurrentUser(null);
        setUserProfile(null);
      }
    })();
  }, []);

  // Load recent activity
  useEffect(() => {
    if (!currentUser) return;
    setLoadingActivity(true);
    setActivityError(null);
    (async () => {
      try {
        const [userRides, userBookings] = await Promise.all([
          getUserRides(currentUser.uid),
          getUserBookings(currentUser.uid),
        ]);
        const activities = [
          ...userRides.map((ride: any) => ({
            type: "ride",
            data: ride,
            date: new Date(ride.createdAt),
          })),
          ...userBookings.map((booking: any) => ({
            type: "booking",
            data: booking,
            date: new Date(booking.createdAt),
          })),
        ]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5);
        setRecentActivity(activities);
      } catch (err: any) {
        setActivityError(err.message || "Could not load recent activity");
      } finally {
        setLoadingActivity(false);
      }
    })();
  }, [currentUser]);

  // Load statistics
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const [userRides, userBookings] = await Promise.all([
          getUserRides(currentUser.uid),
          getUserBookings(currentUser.uid),
        ]);
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(now.getDate() - 60);

        const recentRides = userRides.filter(
          (ride: any) => new Date(ride.createdAt) >= thirtyDaysAgo
        );
        const recentBookings = userBookings.filter(
          (booking: any) =>
            new Date(booking.createdAt) >= thirtyDaysAgo &&
            (booking.status === "completed" || booking.status === "approved")
        );
        const previousMonthRides = userRides.filter(
          (ride: any) =>
            new Date(ride.createdAt) >= sixtyDaysAgo &&
            new Date(ride.createdAt) < thirtyDaysAgo
        );
        const previousMonthBookings = userBookings.filter(
          (booking: any) =>
            new Date(booking.createdAt) >= sixtyDaysAgo &&
            new Date(booking.createdAt) < thirtyDaysAgo &&
            (booking.status === "completed" || booking.status === "approved")
        );
        const totalRidesCount = recentRides.length + recentBookings.length;
        const previousMonthTotal =
          previousMonthRides.length + previousMonthBookings.length;

        let percentChange = 0;
        let changeClass = "bg-gray-100 text-gray-800";
        if (previousMonthTotal > 0) {
          percentChange = Math.round(
            ((totalRidesCount - previousMonthTotal) / previousMonthTotal) * 100
          );
          if (percentChange > 0) changeClass = "bg-green-100 text-green-800";
          else if (percentChange < 0) changeClass = "bg-red-100 text-red-800";
        }
        setTotalRides(totalRidesCount);
        setRidesPercentChange(percentChange);
        setRidesChangeClass(changeClass);
        setCo2Saved(Math.round(totalRidesCount * 0.5));
      } catch {
        setTotalRides(0);
        setCo2Saved(0);
        setRidesPercentChange(0);
        setRidesChangeClass("bg-gray-100 text-gray-800");
      }
    })();
  }, [currentUser]);

  // Load today's rides
  useEffect(() => {
    setLoadingTodayRides(true);
    (async () => {
      try {
        const rides = await getActiveRides();
        const today = new Date();
        const todayIST = new Date(
          today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        todayIST.setHours(0, 0, 0, 0);
        const todaysRides = rides.filter((ride: any) => {
          if (!ride.date) return false;
          const rideDate = new Date(ride.date);
          const rideDateIST = new Date(
            rideDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          rideDateIST.setHours(0, 0, 0, 0);
          return rideDateIST.getTime() === todayIST.getTime();
        });
        setTodayRides(todaysRides);
      } catch {
        setTodayRides([]);
      } finally {
        setLoadingTodayRides(false);
      }
    })();
  }, []);

  // Notification helpers
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, 20);
      return updated;
    });
  }, []);

  const markNotificationRead = (idx: number) => {
    setNotifications((prev) => {
      const updated = [...prev];
      updated[idx].read = true;
      return updated;
    });
  };

  // Header
  return (
    <div className="bg-gray-50 min-h-screen font-inter mt-20">
      {/* Firebase Rules Warning */}
      {showRulesWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 mx-4 rounded shadow-sm">
          <div className="flex">
            <FaExclamationTriangle className="text-yellow-400 mt-1" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Firebase Rules Warning:</strong> The app is using local
                storage due to Firebase security rules.
                <button
                  className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                  onClick={() =>
                    alert("See firebase-rules-guide.txt for details.")
                  }
                >
                  Learn more
                </button>
              </p>
            </div>
            <button
              className="ml-auto pl-3 text-yellow-500 hover:text-yellow-600"
              onClick={() => setShowRulesWarning(false)}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 mt-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <a
            href="/offer"
            className="card quick-action-card bg-white border-3 border-green-400 rounded-2xl p-6 text-center hover:shadow-lg transition"
          >
            <div className="quick-action-icon bg-primary-light mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full">
              <FaCar className="text-black text-xl" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Post a Ride</h3>
            <p className="text-sm text-gray-600 mt-1">
              Share your journey with others
            </p>
            <div className="mt-4 inline-block text-black font-medium text-sm bg-green-100 rounded-2xl p-3 hover:bg-green-500">
              <span>Get Started</span>
              <FaArrowRight className="inline ml-1" />
            </div>
          </a>
          <a
            href="/dashboard/find"
            className="card quick-action-card bg-white p-6 text-center hover:shadow-lg transition border-3 border-green-400 rounded-2xl"
          >
            <div className="quick-action-icon bg-secondary-light mx-auto mb-2 w-12 h-12 flex items-center justify-center rounded-full">
              <FaSearch className="text-black text-xl" />
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Find a Ride</h3>
            <p className="text-sm text-gray-600 mt-1">Join someone's journey</p>
            <div className="mt-4 inline-block text-black font-medium text-sm bg-green-100 rounded-2xl p-3 hover:bg-green-500">
              <span>Search Now</span>
              <FaArrowRight className="inline ml-1" />
            </div>
          </a>
        </div>

        {/* Recent Activity */}
        <div className="card p-6 mb-8 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Activity
            </h2>
            <a
              href="/my-rides"
              className="text-primary text-sm font-medium hover:text-primary-dark transition duration-200 flex items-center"
            >
              View All
              <FaChevronRight className="ml-1 text-xs" />
            </a>
          </div>
          <div>
            {loadingActivity ? (
              <>
                {[1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-4 animate-pulse mb-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-5 w-3/4 bg-gray-200 mb-2 rounded" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </>
            ) : activityError ? (
              <div className="text-center py-6">
                <FaExclamationCircle className="text-red-500 text-3xl mb-3 mx-auto" />
                <p className="text-gray-700 font-medium">
                  Could not load recent activity
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Please check your connection and try again
                </p>
                <button
                  className="mt-2 btn-primary text-sm"
                  onClick={() => window.location.reload()}
                >
                  <FaArrowRight className="inline mr-1" /> Try Again
                </button>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="empty-state text-center py-8">
                <FaCar className="empty-state-icon mx-auto text-3xl text-gray-400 mb-2" />
                <p className="empty-state-text">No recent activity yet</p>
                <p className="empty-state-subtext text-gray-500">
                  Your ride history will appear here
                </p>
                <a
                  href="/post-ride"
                  className="mt-4 inline-block btn-primary bg-primary text-white px-4 py-2 rounded"
                >
                  Post Your First Ride
                </a>
              </div>
            ) : (
              recentActivity.map((activity, idx) => {
                let icon, iconBg, title, statusBadge, subtitle;
                if (activity.type === "ride") {
                  const ride = activity.data;
                  const status = ride.status || "active";
                  if (status === "completed") {
                    icon = <FaCheck />;
                    iconBg = "bg-green-100 text-green-600";
                    title = `Ride completed to ${ride.destination}`;
                    statusBadge = (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full ml-2">
                        Completed
                      </span>
                    );
                  } else if (status === "active") {
                    icon = <FaCar />;
                    iconBg = "bg-primary-light text-primary";
                    title = `Ride offered to ${ride.destination}`;
                    statusBadge = (
                      <span className="text-xs px-2 py-1 bg-primary-light text-primary rounded-full ml-2">
                        Active
                      </span>
                    );
                  } else {
                    icon = <FaTimes />;
                    iconBg = "bg-red-100 text-red-600";
                    title = `Ride cancelled to ${ride.destination}`;
                    statusBadge = (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full ml-2">
                        Cancelled
                      </span>
                    );
                  }
                  const rideDate = new Date(ride.date);
                  const formattedDate = rideDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  subtitle = (
                    <div className="flex items-center mt-2 text-xs">
                      <div className="flex items-center mr-3">
                        <FaCalendarAlt className="text-gray-500 mr-1" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center">
                        <FaClock className="text-gray-500 mr-1" />
                        <span>{formatTime12Hour(ride.time)}</span>
                      </div>
                      <div className="flex items-center ml-3">
                        <FaRupeeSign className="text-gray-500 mr-1" />
                        <span>{ride.price}</span>
                      </div>
                    </div>
                  );
                } else {
                  const booking = activity.data;
                  const status = booking.status || "pending";
                  if (status === "approved") {
                    icon = <FaCheckCircle />;
                    iconBg = "bg-green-100 text-green-600";
                    title = `Booking confirmed to ${
                      booking.destination || "destination"
                    }`;
                    statusBadge = (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full ml-2">
                        Approved
                      </span>
                    );
                  } else if (status === "pending") {
                    icon = <FaClock />;
                    iconBg = "bg-yellow-100 text-yellow-600";
                    title = `Booking pending to ${
                      booking.destination || "destination"
                    }`;
                    statusBadge = (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full ml-2">
                        Pending
                      </span>
                    );
                  } else if (status === "completed") {
                    icon = <FaCheckDouble />;
                    iconBg = "bg-green-100 text-green-600";
                    title = `Ride completed to ${
                      booking.destination || "destination"
                    }`;
                    statusBadge = (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full ml-2">
                        Completed
                      </span>
                    );
                  } else {
                    icon = <FaTimesCircle />;
                    iconBg = "bg-red-100 text-red-600";
                    title = `Booking declined to ${
                      booking.destination || "destination"
                    }`;
                    statusBadge = (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full ml-2">
                        Declined
                      </span>
                    );
                  }
                  let subtitleContent = null;
                  if (booking.date) {
                    const bookingDate = new Date(booking.date);
                    const formattedDate = bookingDate.toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    );
                    subtitleContent = (
                      <div className="flex items-center mt-2 text-xs">
                        <div className="flex items-center mr-3">
                          <FaCalendarAlt className="text-gray-500 mr-1" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center">
                          <FaClock className="text-gray-500 mr-1" />
                          <span>{booking.time || "N/A"}</span>
                        </div>
                        <div className="flex items-center ml-3">
                          <FaRupeeSign className="text-gray-500 mr-1" />
                          <span>{booking.price || "N/A"}</span>
                        </div>
                      </div>
                    );
                  }
                  subtitle = subtitleContent || (
                    <p className="text-sm text-gray-600 mt-1">
                      Booking ID: {booking.id?.substring(0, 8)}
                    </p>
                  );
                }
                return (
                  <div
                    key={idx}
                    className="flex items-start space-x-4 card p-4 mb-3"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}
                    >
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-medium text-gray-900">{title}</p>
                        {statusBadge}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <FaMapMarkerAlt className="text-gray-500 mr-1" />
                        {activity.data.startingPoint ||
                          "Starting point"} to{" "}
                        {activity.data.destination || "Destination"}
                      </p>
                      {subtitle}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="stat-card group p-4 bg-white border-3 border-green-400 rounded-2xl shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Total Rides</h3>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                <FaRoute className="text-green-600 group-hover:text-white" />
              </div>
            </div>
            <p className="stat-value text-2xl font-bold">{totalRides}</p>
            <div className="flex items-center mt-1">
              <p className="stat-label text-xs text-gray-500">Last 30 days</p>
              <span
                className={`ml-2 text-xs px-2 py-1 rounded-full ${ridesChangeClass}`}
              >
                {ridesPercentChange === 0
                  ? "No change"
                  : `${ridesPercentChange > 0 ? "+" : "-"}${Math.abs(
                      ridesPercentChange
                    )}%`}
              </span>
            </div>
          </div>
          <div className="stat-card group p-4 bg-white border-3 border-green-400 rounded-2xl shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">CO₂ Saved</h3>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                <FaLeaf className="text-green-600 group-hover:text-white" />
              </div>
            </div>
            <p className="stat-value text-2xl font-bold text-gray-700">{co2Saved} kg</p>
            <div className="flex items-center mt-1">
              <p className="stat-label text-xs text-gray-500">By carpooling</p>
              <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Eco-friendly
              </span>
            </div>
          </div>
        </div>

        {/* Today's Rides */}
        <div className="card p-6 mt-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Today's Rides
            </h2>
          </div>
          <div>
            {loadingTodayRides ? (
              <div className="ride-card p-4 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="h-6 w-1/2 bg-gray-200 mb-2 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
                <div className="flex items-center mt-4 justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ) : todayRides.length === 0 ? (
              <div className="empty-state text-center py-8">
                <FaCalendarAlt className="empty-state-icon mx-auto text-3xl text-gray-400 mb-2" />
                <p className="empty-state-text">No rides for today</p>
                <p className="empty-state-subtext text-gray-500">
                  Check back later for new rides!
                </p>
              </div>
            ) : (
              todayRides.map((ride, idx) => {
                const startingPoint = ride.startingPoint || "Unknown";
                const destination = ride.destination || "Unknown";
                const price = ride.price !== undefined ? ride.price : "N/A";
                const time = ride.time || "N/A";
                const availableSeats = ride.availableSeats || 0;
                let seatStatus, seatColor;
                if (availableSeats === 0) {
                  seatStatus = "Full";
                  seatColor = "text-red-600 bg-red-50";
                } else if (availableSeats === 1) {
                  seatStatus = "1 seat left";
                  seatColor = "text-yellow-600 bg-yellow-50";
                } else {
                  seatStatus = `${availableSeats} seats left`;
                  seatColor = "text-green-600 bg-green-50";
                }
                return (
                  <div
                    key={ride.id || idx}
                    className="ride-card p-4 cursor-pointer hover:bg-gray-50 rounded transition mb-3"
                    onClick={() => {
                      sessionStorage.setItem("selectedRideId", ride.id);
                      window.location.href = "/ride-details";
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-semibold text-gray-900">
                            {startingPoint} to {destination}
                          </h3>
                          <span
                            className={`ml-2 text-xs px-2 py-1 rounded-full ${seatColor}`}
                          >
                            {seatStatus}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <FaClock className="text-primary mr-1" />
                          <span>
                            {time !== "N/A" ? formatTime12Hour(time) : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        ₹{price}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium">
                          {ride.driverName || "Driver"}
                        </p>
                      </div>
                      <button
                        className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          sessionStorage.setItem("selectedRideId", ride.id);
                          window.location.href = "/ride-details";
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex justify-around items-center h-16">
          <a
            href="/"
            className="bottom-nav-item active flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-4xl"
          >
            <FaHome className="text-xl mb-1" />
            <span>Home</span>
          </a>
          <a
            href="/find"
            className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-4xl"
          >
            <FaSearch className="text-xl mb-1 " />
            <span>Find</span>
          </a>
          <a
            href="/post"
            className="bottom-nav-item flex flex-col items-center text-sm text-black relative bg-green-500"
          >
            <div className="absolute -top-4 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 hover:border-black border-white bg-green-500 hover:bg-green-400">
              <FaPlus className="text-black text-lg" />
            </div>
            <FaCar className="text-xl mb-1" />
          </a>
          <a
            href="/rides"
            className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-4xl"
          >
            <FaCar className="text-xl mb-1" />
            <span>My Rides</span>
          </a>
          <a
            href="/profile"
            className="bottom-nav-item flex flex-col items-center text-sm text-black hover:bg-green-200 p-3 rounded-4xl"
          >
            <FaUserCircle className="text-xl mb-1" />
            <span>Profile</span>
          </a>
        </div>
      </nav>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Notifications
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                onClick={() => setShowNotifications(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="empty-state py-8 text-center">
                  <FaBell className="empty-state-icon mx-auto text-3xl text-gray-400 mb-2" />
                  <p className="empty-state-text">No new notifications</p>
                  <p className="empty-state-subtext text-gray-500">
                    We'll notify you when there's activity
                  </p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={i}
                    className={`card p-4 mb-3 ${n.read ? "" : "bg-green-50"}`}
                  >
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <FaCheck />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-900">{n.title}</p>
                          {!n.read && (
                            <span className="text-xs text-primary font-medium">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">{n.time}</p>
                          {!n.read && (
                            <button
                              className="text-xs text-primary hover:text-primary-dark"
                              onClick={() => markNotificationRead(i)}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
