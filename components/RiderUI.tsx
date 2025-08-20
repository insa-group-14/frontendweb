"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import io, { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// --- Data Structures (Unchanged) ---
interface Location {
  longitude: number;
  latitude: number;
  name: string;
}
interface Suggestion {
  mapbox_id: string;
  name: string;
  place_formatted: string;
  coordinates: {
    longitude: number;
    latitude: number;
  };
}
interface RiderUIProps {
  pickupLocation: Location | null;
  setPickupLocation: (location: Location | null) => void;
  destination: Location | null;
  setDestination: (location: Location | null) => void;
}

// --- ✨ Updated CustomAddressInput Component ---
const CustomAddressInput = ({ label, value, onSelect, placeholder }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isListVisible, setListVisible] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    // --- CHANGE 1: Added a limit to the API call ---
    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
        searchQuery
      )}&access_token=${accessToken}&autocomplete=true&proximity=38.7578,8.9806&limit=7`
    );
    const data = await response.json();

    const mapped = (data.features || []).map((f: any) => ({
      mapbox_id: f.id,
      name: f.properties?.name ?? f.text ?? "",
      place_formatted: f.properties?.place_formatted ?? f.place_name ?? "",
      coordinates: {
        longitude: f.geometry.coordinates[0],
        latitude: f.geometry.coordinates[1],
      },
    }));
    setSuggestions(mapped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    setDebounceTimeout(setTimeout(() => fetchSuggestions(newQuery), 300));
  };

  const handleSelect = (suggestion: Suggestion) => {
    onSelect({
      name: suggestion.name,
      longitude: suggestion.coordinates.longitude,
      latitude: suggestion.coordinates.latitude,
    });
    setQuery(suggestion.name);
    setSuggestions([]);
    setListVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setListVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  useEffect(() => {
    if (value) {
      setQuery(value.name);
    } else {
      setQuery("");
    }
  }, [value]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setListVisible(true)}
        autoComplete="off"
      />
      {isListVisible && suggestions.length > 0 && (
        // --- CHANGE 2: Added max-height and overflow classes here ---
        <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
          <ul>
            {suggestions.map((s) => (
              <li
                key={s.mapbox_id}
                onClick={() => handleSelect(s)}
                className="p-2 hover:bg-accent cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.place_formatted}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Main RiderUI Component (No changes needed here) ---
const RiderUI = ({
  pickupLocation,
  setPickupLocation,
  destination,
  setDestination,
}: RiderUIProps) => {
  const [rideType, setRideType] = useState("private");
  const [estimatedFare, setEstimatedFare] = useState<string | null>(null);

  return (
    <Card className="absolute bottom-4 left-4 right-4 mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Plan Your Ride</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CustomAddressInput
          label="Pickup Location"
          value={pickupLocation}
          onSelect={setPickupLocation}
          placeholder="Enter pickup address"
        />
        <CustomAddressInput
          label="Destination"
          value={destination}
          onSelect={setDestination}
          placeholder="Enter destination address"
        />

        {pickupLocation && destination && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={rideType === "private" ? "default" : "outline"}
                onClick={() => setRideType("private")}
              >
                Private
              </Button>
              <Button
                variant={rideType === "shared" ? "default" : "outline"}
                onClick={() => setRideType("shared")}
              >
                Shared
              </Button>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {estimatedFare
                ? `Request Ride (${estimatedFare} ETB)`
                : "Get Fare Estimate"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RiderUI;