"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession, updateUser } from "@/lib/auth-client";

type UserContextType = {
  profileImage: string;
  setProfileImage: (image: string) => void;
  username: string;
  setUsername: (name: string) => void;
  lat: number;
  lon: number;
  updateLocation: (lat: number, lon: number) => Promise<{error?: any}>;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({
  profileImage: "/images/User.png",
  setProfileImage: () => {},
  username: "User",
  setUsername: () => {},
  lat: -6.920207,
  lon: 107.772969,
  updateLocation: async () => ({}),
  isAuthenticated: false,
  isLoading: true,
});

export function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();

  const [profileImage, setProfileImage] = useState("/images/User.png");
  const [username, setUsername] = useState("User");
  const [lat, setLat] = useState(-6.920207);
  const [lon, setLon] = useState(107.772969);

  // Hydrate from Better Auth session when available
  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.name || "User");
      if (session.user.image) {
        setProfileImage(session.user.image);
      }
      const u = session.user as any;
      if (u.lat !== undefined && u.lat !== null) setLat(u.lat);
      if (u.lon !== undefined && u.lon !== null) setLon(u.lon);
    }
  }, [session]);

  // Also support local overrides (e.g. profile picture crop) persisted in localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem("profileImageOverride");
    if (savedImage) setProfileImage(savedImage);
  }, []);

  const handleSetProfileImage = (image: string) => {
    setProfileImage(image);
    localStorage.setItem("profileImageOverride", image);
  };

  const handleSetUsername = (name: string) => {
    setUsername(name);
    // Optionally sync back to auth-service via API if needed
  };

  const handleUpdateLocation = async (newLat: number, newLon: number) => {
    // Optimistic UI update
    setLat(newLat);
    setLon(newLon);
    
    // Unified API call to Better Auth to avoid race conditions
    const { error } = await updateUser({ lat: newLat, lon: newLon } as any);
    if (error) {
      // Revert if error (Optional: could track original lat/lon to revert to)
      console.error("Failed to update location in DB", error);
    }
    return { error };
  };

  return (
    <UserContext.Provider
      value={{
        profileImage,
        setProfileImage: handleSetProfileImage,
        username,
        setUsername: handleSetUsername,
        lat,
        lon,
        updateLocation: handleUpdateLocation,
        isAuthenticated: !!session?.user,
        isLoading: isPending,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}