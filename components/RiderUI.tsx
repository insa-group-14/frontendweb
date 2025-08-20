'use client'
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import io from 'socket.io-client';

const RiderUI = () => {
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideType, setRideType] = useState('regular');
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [rideStatus, setRideStatus] = useState('idle');
  const { getToken } = useAuth();

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleEstimateFare = async () => {
    // API call to /api/rides/estimate
  };

  const handleRequestRide = async () => {
    // API call to /api/rides/request
  };

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white p-4 shadow-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Pickup</label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Destination</label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
      </div>
      <div className="mt-4">
        <button onClick={handleEstimateFare} className="w-full rounded-md bg-black py-2 text-white">
          Estimate Fare
        </button>
      </div>
      <div className="mt-2">
        <button onClick={handleRequestRide} className="w-full rounded-md bg-blue-600 py-2 text-white">
          Request Ride
        </button>
      </div>
    </div>
  );
};

export default RiderUI;