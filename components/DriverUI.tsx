'use client'
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const DriverUI = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    if (isAvailable) {
      socket.emit('join-available-drivers-room');
    }

    socket.on('new-ride-request', (ride) => {
      // Handle new ride request
    });

    return () => {
      socket.disconnect();
    };
  }, [isAvailable]);

  const handleAvailabilityToggle = () => {
    setIsAvailable(!isAvailable);
  };

  return (
    <div className="absolute top-0 left-0 w-full bg-white p-4 shadow-lg">
      <button onClick={handleAvailabilityToggle} className={`w-full rounded-md py-2 text-white ${isAvailable ? 'bg-red-500' : 'bg-green-500'}`}>
        {isAvailable ? 'Go Offline' : 'Go Online'}
      </button>
    </div>
  );
};

export default DriverUI;