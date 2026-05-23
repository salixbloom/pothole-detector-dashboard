'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAccessibility } from '../context/AccessibilityContext';
import type { Contrast } from '../context/AccessibilityContext';

export interface HeatmapPoint {
  pothole_id: string;
  severity_score: number;  // 0–1
  coords: [number, number]; // [longitude, latitude] — GeoJSON order
}

interface Props {
  flyToCoords?: [number, number] | null;
  potholes?: HeatmapPoint[];
}

function resolveStyle(contrast: Contrast): string {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  if (contrast === 'high') {
    return dark
      ? 'mapbox://styles/mapbox/navigation-night-v1'
      : 'mapbox://styles/mapbox/navigation-day-v1';
  }
  return dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
}

export default function PotholeMap({ flyToCoords, potholes = [] }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { theme, contrast } = useAccessibility();
  const mountedStyle = useRef<string | null>(null);
  const potholesRef = useRef(potholes);
  potholesRef.current = potholes;
  // Needed so the map 'load' callback can see coords set before the map finishes loading
  const flyToCoordsRef = useRef(flyToCoords);
  flyToCoordsRef.current = flyToCoords;

  function addHeatmap(m: mapboxgl.Map) {
    if (m.getSource('potholes')) return;

    m.addSource('potholes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: potholesRef.current.map(p => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: p.coords },
          properties: { severity_score: p.severity_score },
        })),
      },
    });

    m.addLayer({
      id: 'pothole-heat',
      type: 'heatmap',
      source: 'potholes',
      minzoom: 10,
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity_score'], 0, 0, 1, 1],
        'heatmap-intensity': 1.2,
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 25, 15, 45, 17, 65],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0, 12, 0.72],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,   'rgba(0,0,0,0)',
          0.2, 'rgba(255,255,80,0.55)',
          0.5, 'rgba(255,160,0,0.72)',
          0.8, 'rgba(230,50,0,0.82)',
          1,   'rgba(210,20,0,0.88)',
        ],
      },
    });
  }

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
    const style = resolveStyle(contrast);
    mountedStyle.current = style;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style,
      center: [-122.4443, 47.2529], // Tacoma, WA
      zoom: 12,
    });

    map.current.on('load', () => {
      if (!map.current) return;
      addHeatmap(map.current);
      // Handle flyToCoords that were set before the map finished loading (e.g. from URL params)
      if (flyToCoordsRef.current) {
        map.current.flyTo({ center: flyToCoordsRef.current, zoom: 16, duration: 1200 });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map.current) return;
    const next = resolveStyle(contrast);
    if (next === mountedStyle.current) return;
    mountedStyle.current = next;
    map.current.setStyle(next);
    map.current.once('style.load', () => {
      if (map.current) addHeatmap(map.current);
    });
  }, [theme, contrast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map.current || !flyToCoords) return;
    map.current.flyTo({ center: flyToCoords, zoom: 16, duration: 1200 });
  }, [flyToCoords]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
