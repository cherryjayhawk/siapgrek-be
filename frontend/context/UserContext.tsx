"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession, updateUser } from "@/lib/auth-client";

type UserContextType = {
  profileImage: string;
  setProfileImage: (image: string) => void;
  username: string;
  setUsername: (name: string) => void;
  lat: number;
  setLat: (lat: number) => void;
  lon: number;
  setLon: (lon: number) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({
  profileImage: "/images/User.png",
  setProfileImage: () => {},
  username: "User",
  setUsername: () => {},
  lat: -6.920207,
  setLat: () => {},
  lon: 107.772969,
  setLon: () => {},
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

  const handleSetLat = (newLat: number) => {
    setLat(newLat);
    updateUser({ lat: newLat } as any);
  };

  const handleSetLon = (newLon: number) => {
    setLon(newLon);
    updateUser({ lon: newLon } as any);
  };

  return (
    <UserContext.Provider
      value={{
        profileImage,
        setProfileImage: handleSetProfileImage,
        username,
        setUsername: handleSetUsername,
        lat,
        setLat: handleSetLat,
        lon,
        setLon: handleSetLon,
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