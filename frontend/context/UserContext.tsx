"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

type UserContextType = {
  profileImage: string;
  setProfileImage: (image: string) => void;
  username: string;
  setUsername: (name: string) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({
  profileImage: "/images/User.png",
  setProfileImage: () => {},
  username: "User",
  setUsername: () => {},
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

  // Hydrate from Better Auth session when available
  useEffect(() => {
    if (session?.user) {
      setUsername(session.user.name || "User");
      if (session.user.image) {
        setProfileImage(session.user.image);
      }
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

  return (
    <UserContext.Provider
      value={{
        profileImage,
        setProfileImage: handleSetProfileImage,
        username,
        setUsername: handleSetUsername,
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