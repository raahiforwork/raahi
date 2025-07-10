"use client";

import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/getUserProfile";

export default function WelcomeBanner() {
  const [userName, setUserName] = useState({ firstName: "Raahi", lastName: "" });

  useEffect(() => {
    async function fetchName() {
      try {
        const user = await getUserProfile();
        setUserName({ firstName: user.firstName, lastName: user.lastName });
      } catch (err) {
        console.error("Error loading user profile", err);
      }
    }

    fetchName();
  }, []);

  return (
    <div className="text-center py-6">
      <h2 className="text-3xl font-bold text-white mb-2">
        Welcome back,{" "}
        <span className="bg-gradient-to-r from-carpool-400 to-carpool-600 bg-clip-text text-transparent">
          {userName.firstName} {userName.lastName}
        </span>
        ! 🚗
      </h2>
    </div>
  );
}
