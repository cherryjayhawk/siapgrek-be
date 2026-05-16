"use client";

import { createContext, useContext, useState, useEffect } from "react";

type UserContextType = {
  profileImage: string;
  setProfileImage: (image: string) => void;
  username: string;
  setUsername: (name: string) => void;
};

const UserContext = createContext<UserContextType>({
  profileImage: "/images/User.png",
  setProfileImage: () => {},
  username: "User",
  setUsername: () => {},
});

export function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profileImage, setProfileImage] =
    useState("/images/User.png");

  const [username, setUsername] =
    useState("Hailey Williams");

  /* load localstorage */

  useEffect(() => {
    const savedImage =
      localStorage.getItem("profileImage");

    const savedName =
      localStorage.getItem("username");

    if (savedImage) setProfileImage(savedImage);
    if (savedName) setUsername(savedName);
  }, []);

  useEffect(() => {
    localStorage.setItem("profileImage", profileImage);
  }, [profileImage]);

  useEffect(() => {
    localStorage.setItem("username", username);
  }, [username]);

  return (
    <UserContext.Provider
      value={{
        profileImage,
        setProfileImage,
        username,
        setUsername,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}