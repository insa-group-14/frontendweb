'use client'
import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';

// Define the structure for a Ride object
interface Ride {
    _id: string;
    pickupLocation: { longitude: number; latitude: number };
    destination: { longitude: number; latitude: number };
    rideType: string;
}

const DriverUI = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rideRequest, setRideRequest] = useState<Ride | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Driver connected to Socket.IO');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  useEffect(() => {
    if (socket) {
        if (isAvailable) {
            console.log("Joining available drivers room...");
            socket.emit('join-available-drivers-room');

            socket.on('new-ride-request', (ride: Ride) => {
                console.log('New ride request received:', ride);
                setRideRequest(ride);
            });
        } else {
             console.log("Leaving available drivers room...");
            socket.off('new-ride-request');
        }
    }
  }, [isAvailable, socket]);


  const handleAvailabilityToggle = () => {
    setIsAvailable(!isAvailable);
    if(rideRequest) {
        setRideRequest(null); // Clear request when going offline
    }
  };
  
  const handleAcceptRide = () => {
    if (socket && rideRequest) {
      // NOTE: Replace with the actual driver's ID from your database
      const mockDriverId = "689cc0b706706260ac8b602b"; 
      socket.emit('accept-ride', { rideId: rideRequest._id, driverId: mockDriverId });
      setRideRequest(null); // Clear the request from UI
    }
  }

  const handleDeclineRide = () => {
    setRideRequest(null);
  }

  return (
    <div className="absolute top-16 left-0 w-full p-4">
        <div className="bg-white p-4 shadow-lg rounded-md">
            <button onClick={handleAvailabilityToggle} className={`w-full rounded-md py-2 text-white ${isAvailable ? 'bg-red-500' : 'bg-green-500'}`}>
                {isAvailable ? 'Go Offline' : 'Go Online'}
            </button>

            {isAvailable && rideRequest && (
                <div className="mt-4 p-4 border rounded-md">
                    <h3 className="font-bold text-lg">New Ride Request!</h3>
                    <p>Type: {rideRequest.rideType}</p>
                    <p>From: {rideRequest.pickupLocation.latitude.toFixed(4)}, {rideRequest.pickupLocation.longitude.toFixed(4)}</p>
                    <p>To: {rideRequest.destination.latitude.toFixed(4)}, {rideRequest.destination.longitude.toFixed(4)}</p>
                    <div className="flex justify-around mt-2">
                        <button onClick={handleAcceptRide} className="bg-green-500 text-white px-4 py-2 rounded-md">Accept</button>
                        <button onClick={handleDeclineRide} className="bg-red-500 text-white px-4 py-2 rounded-md">Decline</button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default DriverUI;