'use client';
import { LngLatLike } from 'maplibre-gl';
import { Layer, Map, Marker, Source } from 'react-map-gl/maplibre';
import type { LineLayerSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css';

interface Location {
  longitude: number;
  latitude: number;
}

interface MapProps {
  pickupLocation: Location | null;
  destination: Location | null;
  driverLocation: Location | null;
  routeCoordinates: number[][] | null;
}

const routeLayerStyle: LineLayerSpecification = {
  id: 'route',
  type: 'line',
  source: 'route',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  paint: {
    'line-color': '#3b82f6', // A nice blue color
    'line-width': 6,
  },
};

const Mapbox = ({ pickupLocation, destination, driverLocation, routeCoordinates }: MapProps) => {
  const routeGeoJson = routeCoordinates ? {
      type: 'Feature' as const,
      properties: {},
      geometry: {
          type: 'LineString' as const,
          coordinates: routeCoordinates,
      },
  } : null;

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
            color="#0000FF" // Blue for pickup
          />
        )}
        {destination && (
          <Marker
            longitude={destination.longitude}
            latitude={destination.latitude}
            color="#008000" // Green for destination
          />
        )}
        {driverLocation && (
          <Marker
            longitude={driverLocation.longitude}
            latitude={driverLocation.latitude}
            style={{ zIndex: 10 }}
          >
            <div className="flex items-center justify-center bg-white rounded-full p-1 shadow-lg">
                <div className="text-3xl">🚗</div>
            </div>
          </Marker>
        )}
        
        {routeGeoJson && (
            <Source id="route" type="geojson" data={routeGeoJson}>
                <Layer {...routeLayerStyle} />
            </Source>
        )}
      </Map>
    </div>
  );
};

export default Mapbox;