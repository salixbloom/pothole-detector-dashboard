'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAccessibility } from '../context/AccessibilityContext';
import type { Contrast } from '../context/AccessibilityContext';

export interface HeatmapPoint {
  id: number;
  severity: number;
  coords: [number, number];
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
  // Keep a ref so event callbacks always see the latest pothole data without stale closures
  const potholesRef = useRef(potholes);
  potholesRef.current = potholes;

  function addHeatmap(m: mapboxgl.Map) {
    if (m.getSource('potholes')) return;

    m.addSource('potholes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: potholesRef.current.map(p => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: p.coords },
          properties: { severity: p.severity },
        })),
      },
    });

    m.addLayer({
      id: 'pothole-heat',
      type: 'heatmap',
      source: 'potholes',
      // Only render when zoomed in enough to distinguish individual streets
      minzoom: 10,
      paint: {
        // Weight each point by its severity (6–10 scale → 0.3–1.0)
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'severity'], 6, 0.5, 8, 1],
        'heatmap-intensity': 1.2,
        // Radius grows with zoom so blobs stay street-scale, not city-scale
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 25, 15, 45, 17, 65],
        // Fade in between zoom 11–12, then hold at 0.72
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0, 12, 0.72],
        // Colour ramp: transparent → light yellow → orange → bright red
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
      center: [-6.2603, 53.3498],
      zoom: 12,
    });

    map.current.on('load', () => {
      if (map.current) addHeatmap(map.current);
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
    // Re-add heatmap after the new style finishes loading (setStyle wipes all custom layers)
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
