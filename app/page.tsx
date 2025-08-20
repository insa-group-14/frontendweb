'use client'
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Map from "../components/Map";
import RiderUI from "../components/RiderUI";
import DriverUI from "../components/DriverUI";

interface Location {
  longitude: number;
  latitude: number;
  name: string;
}

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();
  
  // State for map markers - LIFTED UP to the parent component
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      setIsLoading(true);
      const token = await getToken();
      if (token) {
        try {
          const response = await fetch('http://localhost:3000/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          setUserRole(data.userType); // Corrected field
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      setIsLoading(false);
    };

    fetchUserRole();
  }, [getToken]);

  return (
    <div>
      <SignedIn>
        <div className="absolute top-4 right-4 z-10">
          <UserButton />
        </div>
        
        {/* The Map now receives the state */}
        <Map pickupLocation={pickupLocation} destination={destination} />
        
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <p>Loading your experience...</p>
          </div>
        ) : (
          <>
            {userRole === 'rider' && (
              // The RiderUI receives the state and functions to update it
              <RiderUI 
                pickupLocation={pickupLocation} 
                setPickupLocation={setPickupLocation} 
                destination={destination} 
                setDestination={setDestination} 
              />
            )}
            {userRole === 'driver' && <DriverUI />}
          </>
        )}

      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <h1 className="text-2xl">Please sign in to use the app</h1>
        </div>
      </SignedOut>
    </div>
  );
}