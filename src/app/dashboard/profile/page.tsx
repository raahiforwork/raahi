"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import InnerNavbar from "@/components/InnerNavbar";

// import { auth, getCurrentUser, createUserProfile, uploadProfilePicture } from "@/lib/firebase";

const departmentOptions = [
  { value: "", label: "Select your department" },
  { value: "cse", label: "Computer Science" },
  { value: "ece", label: "Electronics & Communication" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "ce", label: "Civil Engineering" },
  { value: "bt", label: "Biotechnology" },
  { value: "bba", label: "Business Administration" },
  { value: "law", label: "School of Law" },
  { value: "other", label: "Other" },
];

const yearOptions = [
  { value: "", label: "Select your year" },
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
];

export default function ProfilePage() {
  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState(
    "https://via.placeholder.com/150",
  );

  // Error state
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [departmentError, setDepartmentError] = useState(false);
  const [yearError, setYearError] = useState(false);
  const [formError, setFormError] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  // Loading state
  const [submitting, setSubmitting] = useState(false);

  const profilePicInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setProfilePreview(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    let valid = true;
    setNameError(fullName.trim().length < 3);
    setPhoneError(!/^[0-9]{10}$/.test(phoneNumber));
    setDepartmentError(department === "");
    setYearError(yearOfStudy === "");
    if (fullName.trim().length < 3) valid = false;
    if (!/^[0-9]{10}$/.test(phoneNumber)) valid = false;
    if (department === "") valid = false;
    if (yearOfStudy === "") valid = false;
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // const user = await getCurrentUser();
      const user = { uid: "demo" }; // Remove this line and uncomment above in real use
      if (!user) throw new Error("No authenticated user found");

      let profileData: any = {
        uid: user.uid,
        fullName: fullName.trim(),
        phoneNumber: "+91" + phoneNumber,
        department,
        yearOfStudy,
        gender: gender || "prefer_not_to_say",
        bio: bio.trim() || "",
        profileComplete: true,
        createdAt: new Date().toISOString(),
      };

      // if (profilePicture) {
      //   const imageUrl = await uploadProfilePicture(user.uid, profilePicture);
      //   profileData.profilePicture = imageUrl;
      // }

      // await createUserProfile(user.uid, profileData);

      alert("Profile completed successfully! Please login again.");
      // await auth.signOut();
      // window.location.href = "login.html";
    } catch (error) {
      setFormError("Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div>Loading...</div>; // auth still resolving
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <InnerNavbar />
      <div className="container mx-auto px-4 lg:px-8 py-8 mt-10 mb-10">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 sm:p-8 lg:p-12 w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Help us create a trusted carpooling community
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Profile Picture */}
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={profilePreview}
                  alt="Profile Picture"
                  className="w-32 h-32 rounded-full object-cover border-4 border-green-500 mb-2"
                />
                <label
                  htmlFor="profilePic"
                  className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 cursor-pointer hover:bg-green-700"
                  onClick={() => profilePicInputRef.current?.click()}
                >
                  <i className="fas fa-camera"></i>
                </label>
                <input
                  type="file"
                  id="profilePic"
                  className="hidden"
                  accept="image/*"
                  ref={profilePicInputRef}
                  onChange={handleProfilePicChange}
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-lg bg-white text-black border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => setNameError(fullName.trim().length < 3)}
                />
                {nameError && (
                  <p className="error-message text-red-500 text-sm">
                    Please enter your full name
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    className="flex-1 block w-full rounded-r-lg bg-white text-black border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onBlur={() =>
                      setPhoneError(!/^[0-9]{10}$/.test(phoneNumber))
                    }
                  />
                </div>
                {phoneError && (
                  <p className="error-message text-red-500 text-sm">
                    Please enter a valid 10-digit phone number
                  </p>
                )}
              </div>
            </div>

            {/* Department and Year */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  required
                  className="block w-full rounded-lg bg-white text-gray-700 border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  onBlur={() => setDepartmentError(department === "")}
                >
                  {departmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {departmentError && (
                  <p className="error-message text-red-500 text-sm">
                    Please select your department
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year of Study
                </label>
                <select
                  required
                  className="block w-full rounded-lg bg-white text-gray-700 border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  onBlur={() => setYearError(yearOfStudy === "")}
                >
                  {yearOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {yearError && (
                  <p className="error-message text-red-500 text-sm">
                    Please select your year of study
                  </p>
                )}
              </div>
            </div>

            {/* Gender (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender (Optional)
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    className="h-4 w-4 bg-white text-green-600 focus:ring-green-500"
                    checked={gender === "male"}
                    onChange={() => setGender("male")}
                  />
                  <span className="ml-2 text-gray-700">Male</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    className="h-4 w-4 bg-white text-green-600 focus:ring-green-500 border-gray-300"
                    checked={gender === "female"}
                    onChange={() => setGender("female")}
                  />
                  <span className="ml-2 text-gray-700">Female</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    className="h-4 w-4 bg-white text-green-600 focus:ring-green-500 border-gray-300"
                    checked={gender === "other"}
                    onChange={() => setGender("other")}
                  />
                  <span className="ml-2 text-gray-700">Prefer not to say</span>
                </label>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Optional)
              </label>
              <textarea
                className="block w-full rounded-lg bg-white text-black border-gray-300 border p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Tell us a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-200 flex items-center justify-center"
              disabled={submitting}
            >
              <i className="fas fa-check-circle mr-2"></i>
              <span>Complete Profile</span>
              {submitting && <div className="loading-spinner ml-2"></div>}
            </button>
            {formError && (
              <p className="error-message text-center text-red-500">
                {formError}
              </p>
            )}
          </form>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
