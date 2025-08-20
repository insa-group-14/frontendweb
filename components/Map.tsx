'use client';
import { LngLatLike } from 'maplibre-gl';
import { Map, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Location {
  longitude: number;
  latitude: number;
}

interface MapProps {
  pickupLocation: Location | null;
  destination: Location | null;
}

const Mapbox = ({ pickupLocation, destination }: MapProps) => {
  return (
    <div className="absolute inset-0">
      <Map
        initialViewState={{
          longitude: 38.7578,
          latitude: 8.9806,
          zoom: 12,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      >
        {pickupLocation && (
          <Marker
            longitude={pickupLocation.longitude}
            latitude={pickupLocation.latitude}
            color="blue"
          />
        )}
        {destination && (
          <Marker
            longitude={destination.longitude}
            latitude={destination.latitude}
            color="green"
          />
        )}
      </Map>
    </div>
  );
};

export default Mapbox;