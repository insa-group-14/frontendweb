'use client'
import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


// --- Data Structures ---
interface Location {
    longitude: number;
    latitude: number;
    name?: string;
}

interface Ride {
    _id: string;
    pickupLocation: Location;
    destination: Location;
    rideType: 'private' | 'shared';
    status: 'searching' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
}

const DriverUI = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rideRequest, setRideRequest] = useState<Ride | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => console.log('Driver connected to Socket.IO'));

    return () => { newSocket.disconnect(); };
  }, []);
  
  useEffect(() => {
    if (socket) {
        if (isAvailable) {
            console.log("Joining available drivers room...");
            socket.emit('join-available-drivers-room');
            
            socket.on('new-ride-request', (ride: Ride) => {
                // Only show a new request if not already busy
                if (!activeRide && !rideRequest) {
                    console.log('New ride request received:', ride);
                    setRideRequest(ride);
                }
            });
        } else {
            console.log("Leaving available drivers room...");
            socket.emit('leave-available-drivers-room'); // Good practice to have a leave event
            socket.off('new-ride-request');
        }
    }
  }, [isAvailable, socket, activeRide, rideRequest]);

  const handleAvailabilityToggle = () => setIsAvailable(!isAvailable);
  
  const handleAcceptRide = () => {
    if (socket && rideRequest) {
      // In a real app, get this from your auth context
      const MOCK_DRIVER_ID = "689cc0b706706260ac8b602b"; 
      
      const payload = { rideId: rideRequest._id, driverId: MOCK_DRIVER_ID };
      socket.emit('accept-ride', payload);
      
      // Move the ride from request to active
      setActiveRide(rideRequest);
      setRideRequest(null);
    }
  };

  const handleDeclineRide = () => setRideRequest(null);

  // --- NEW TRIP MANAGEMENT FUNCTIONS ---
  const handleStartTrip = () => {
    if (socket && activeRide) {
      socket.emit('start-trip', { rideId: activeRide._id });
      setActiveRide({ ...activeRide, status: 'in-progress' });
    }
  };
  
  const handleEndTrip = () => {
    if (socket && activeRide) {
      socket.emit('end-trip', { rideId: activeRide._id });
      setActiveRide(null); // Trip is over, clear the active ride
    }
  };

  const handleCancelTrip = () => {
    if (socket && activeRide) {
        socket.emit('cancel-trip', { rideId: activeRide._id, cancelledBy: 'driver' });
        setActiveRide(null); // Trip is over, clear the active ride
    }
  };

  useEffect(() => {
    // Start sending location updates when a ride is in progress
    if (activeRide && activeRide.status === 'in-progress' && socket) {
        // A mock location that we can "move"
        let mockLocation = {
            longitude: activeRide.pickupLocation.longitude + 0.001,
            latitude: activeRide.pickupLocation.latitude + 0.001,
        };

        const interval = setInterval(() => {
            // Move the location slightly to simulate driving
            mockLocation.longitude += 0.0001;
            mockLocation.latitude += 0.0001;
            
            const payload = {
                driverId: "689cc0b706706260ac8b602b", // Using the mock ID from your backend test
                rideId: activeRide._id,
                location: mockLocation,
            };
            
            console.log("Driver sending location update:", payload);
            socket.emit('update-location', payload);

        }, 5000); // Send an update every 5 seconds

        // Stop sending updates when the component unmounts or the ride ends
        return () => clearInterval(interval);
    }
}, [activeRide, socket]);

  return (
    <Card className="absolute top-4 left-4 right-4 mx-auto max-w-sm z-10">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Driver Mode</CardTitle>
                <Button onClick={handleAvailabilityToggle} variant={isAvailable ? 'destructive' : 'default'}>
                    {isAvailable ? 'Go Offline' : 'Go Online'}
                </Button>
            </div>
        </CardHeader>

        <CardContent>
            {/* RIDE REQUEST VIEW */}
            {isAvailable && rideRequest && !activeRide && (
                <Card className="bg-secondary">
                    <CardHeader>
                        <CardTitle>New Ride Request!</CardTitle>
                        <CardDescription>Type: {rideRequest.rideType}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold">From:</p>
                            <p>{rideRequest.pickupLocation.name}</p>
                        </div>
                         <div>
                            <p className="font-semibold">To:</p>
                            <p>{rideRequest.destination.name}</p>
                        </div>
                        <div className="flex justify-around mt-2">
                            <Button onClick={handleAcceptRide} className="bg-green-600 hover:bg-green-700">Accept</Button>
                            <Button onClick={handleDeclineRide} variant="outline">Decline</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* IN-TRIP VIEW */}
            {activeRide && (
                 <Card className="border-blue-500 border-2">
                    <CardHeader>
                        <CardTitle>Trip In Progress</CardTitle>
                        <CardDescription>Status: {activeRide.status}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-2">
                        {activeRide.status === 'accepted' && (
                             <Button onClick={handleStartTrip} className="w-full">Start Trip</Button>
                        )}
                        {activeRide.status === 'in-progress' && (
                            <Button onClick={handleEndTrip} className="w-full">End Trip</Button>
                        )}
                        <Button onClick={handleCancelTrip} variant="destructive" className="w-full">Cancel Trip</Button>
                    </CardContent>
                </Card>
            )}

             {/* IDLE VIEW */}
            {isAvailable && !rideRequest && !activeRide && (
                <div className="text-center text-muted-foreground">
                    <p>You are online.</p>
                    <p>Waiting for ride requests...</p>
                </div>
            )}
        </CardContent>
    </Card>
  );
};

export default DriverUI;