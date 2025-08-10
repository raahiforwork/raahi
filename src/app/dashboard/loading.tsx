"use client";
import Lottie from "lottie-react";
import rippleAnimation from "../../../public/Ripple loading animation.json";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <Lottie animationData={rippleAnimation} loop={true} className="w-28 h-28" />
    </div>
  );
}
