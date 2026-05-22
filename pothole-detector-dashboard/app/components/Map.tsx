'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Props {
  flyToCoords?: [number, number] | null;
}

export default function PotholeMap({ flyToCoords }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-6.2603, 53.3498],
      zoom: 12,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !flyToCoords) return;
    map.current.flyTo({ center: flyToCoords, zoom: 16, duration: 1200 });
  }, [flyToCoords]);

  return <div ref={mapContainer} className="w-full h-full" />;
}