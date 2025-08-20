'use client'
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Map from "../components/Map";
import RiderUI from "../components/RiderUI";
import DriverUI from "../components/DriverUI";

export default function Home() {
  const [userRole, setUserRole] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = await getToken();
      if (token) {
        try {
          const response = await fetch('http://localhost:3000/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          setUserRole(data.role);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [getToken]);

  return (
    <div>
      <SignedIn>
        <div className="absolute top-4 right-4 z-10">
          <UserButton />
        </div>
        <Map />
        {userRole === 'rider' && <RiderUI />}
        {userRole === 'driver' && <DriverUI />}
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <h1 className="text-2xl">Please sign in to use the app</h1>
        </div>
      </SignedOut>
    </div>
  );
}
