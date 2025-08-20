'use client'
import { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const Mapbox = () => {
  const [viewport, setViewport] = useState({
    longitude: 38.7578,
    latitude: 8.9806,
    zoom: 12,
  });

  return (
    <div className="absolute inset-0">
      <Map
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
      </Map>
    </div>
  );
};

export default Mapbox;