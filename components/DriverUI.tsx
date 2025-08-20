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
    const [routeToPickup, setRouteToPickup] = useState<number[][] | null>(null);


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
                    if (!activeRide && !rideRequest) {
                        console.log('New ride request received:', ride);
                        setRideRequest(ride);
                    }
                });
            } else {
                console.log("Leaving available drivers room...");
                socket.emit('leave-available-drivers-room');
                socket.off('new-ride-request');
            }
        }
    }, [isAvailable, socket, activeRide, rideRequest]);

    const fetchRouteToPickup = async (driverLocation: Location, pickupLocation: Location) => {
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${driverLocation.longitude},${driverLocation.latitude};${pickupLocation.longitude},${pickupLocation.latitude}?geometries=geojson&access_token=${accessToken}`
            );
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                setRouteToPickup(data.routes[0].geometry.coordinates);
                console.log("Fetched route to pickup location.");
            }
        } catch (error) {
            console.error("Failed to fetch route to pickup:", error);
        }
    };


    const handleAvailabilityToggle = () => setIsAvailable(!isAvailable);

    const handleAcceptRide = () => {
        if (socket && rideRequest) {
            // This is your mock driver ID
            const MOCK_DRIVER_ID = "689cc0b706706260ac8b602b"; 
            
            const payload = { rideId: rideRequest._id, driverId: MOCK_DRIVER_ID };
            socket.emit('accept-ride', payload);
            
            setActiveRide(rideRequest);
            setRideRequest(null);

            // **THE FIX**: Simulate a driver starting location near the pickup
            // and fetch the route from there.
            const mockDriverStartLocation = {
                longitude: rideRequest.pickupLocation.longitude + 0.01,
                latitude: rideRequest.pickupLocation.latitude + 0.01,
            };

            fetchRouteToPickup(mockDriverStartLocation, rideRequest.pickupLocation);
        }
    };

    const handleDeclineRide = () => setRideRequest(null);

    const handleStartTrip = () => {
        if (socket && activeRide) {
            socket.emit('start-trip', { rideId: activeRide._id });
            setActiveRide({ ...activeRide, status: 'in-progress' });
        }
    };

    const handleEndTrip = () => {
        if (socket && activeRide) {
            socket.emit('end-trip', { rideId: activeRide._id });
            setActiveRide(null);
        }
    };

    const handleCancelTrip = () => {
        if (socket && activeRide) {
            socket.emit('cancel-trip', { rideId: activeRide._id, cancelledBy: 'driver' });
            setActiveRide(null);
        }
    };

    useEffect(() => {
        // **This logic is now corrected to step through the fetched route**
        if (activeRide && (activeRide.status === 'accepted' || activeRide.status === 'in-progress') && socket && routeToPickup) {
            let routeIndex = 0;

            const interval = setInterval(() => {
                if (routeIndex < routeToPickup.length) {
                    const nextLocation = {
                        longitude: routeToPickup[routeIndex][0],
                        latitude: routeToPickup[routeIndex][1],
                    };

                    const payload = {
                        driverId: "689cc0b706706260ac8b602b",
                        rideId: activeRide._id,
                        location: nextLocation,
                    };

                    console.log(`Driver sending location update (${routeIndex + 1}/${routeToPickup.length}):`, payload);
                    socket.emit('update-location', payload);

                    // Move to the next point on the route for the next interval
                    routeIndex++;
                } else {
                    // Stop the interval once the end of the route is reached
                    clearInterval(interval);
                    console.log("Driver has arrived at the pickup location.");
                }
            }, 2000); // Send an update every 2 seconds

            return () => clearInterval(interval);
        }
    }, [activeRide, socket, routeToPickup]);

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