'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAccessibility } from '../context/AccessibilityContext';
import type { Contrast } from '../context/AccessibilityContext';

interface Props {
  flyToCoords?: [number, number] | null;
}

function resolveStyle(contrast: Contrast): string {
  // Read the resolved value from the HTML element — AccessibilityContext keeps this
  // updated, including when theme is 'system' and the OS preference changes.
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  if (contrast === 'high') {
    return dark
      ? 'mapbox://styles/mapbox/navigation-night-v1'
      : 'mapbox://styles/mapbox/navigation-day-v1';
  }
  return dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
}

export default function PotholeMap({ flyToCoords }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { theme, contrast } = useAccessibility();
  const mountedStyle = useRef<string | null>(null);

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

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map.current) return;
    const next = resolveStyle(contrast);
    // Skip if the style hasn't actually changed (avoids a no-op setStyle on mount)
    if (next === mountedStyle.current) return;
    mountedStyle.current = next;
    map.current.setStyle(next);
  }, [theme, contrast]);

  useEffect(() => {
    if (!map.current || !flyToCoords) return;
    map.current.flyTo({ center: flyToCoords, zoom: 16, duration: 1200 });
  }, [flyToCoords]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
