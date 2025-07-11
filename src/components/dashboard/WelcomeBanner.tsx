import { useAuth } from "@/context/AuthContext";

export default function WelcomeBanner() {
  const { userProfile } = useAuth();

  return (
    <div className="text-center py-6">
      <h2 className="text-3xl font-bold text-white mb-2">
        Welcome back,{" "}
        <span className="bg-gradient-to-r from-carpool-400 to-carpool-600 bg-clip-text text-transparent">
          {userProfile?.firstName} {userProfile?.lastName}
        </span>
        ! 🚗
      </h2>
    </div>
  );
}