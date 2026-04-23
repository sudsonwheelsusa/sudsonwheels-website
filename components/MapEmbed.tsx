"use client";

import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";

const ASHLAND_CENTER = { lat: 40.8648, lng: -82.3165 };

const MAP_STYLES_DARK: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2c40" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d2c40" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8da0b8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d4a6a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1d3557" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#c8102e" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#8b0000" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1f30" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#263a52" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1f3a28" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c8102e" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779a" }] },
];

const SIZE_CLASSES = {
  sm: "h-[200px]",
  md: "h-[360px]",
} as const;

interface MapEmbedProps {
  size?: keyof typeof SIZE_CLASSES;
  zoom?: number;
}

export default function MapEmbed({ size = "md", zoom = 11 }: MapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Only initialize the Maps SDK once the container is visible in the viewport.
  // Prevents API calls for users who never scroll to the map.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    id: "sow-google-map-script",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);
  void map;

  const containerClass = `${SIZE_CLASSES[size]} w-full`;

  return (
    <div ref={containerRef} className={containerClass}>
      {loadError ? (
        <div className="flex h-full items-center justify-center rounded-xl bg-navy/10 text-sm text-gray-400">
          Map unavailable
        </div>
      ) : !inView || !isLoaded ? (
        <div className="h-full animate-pulse rounded-xl bg-navy/10" />
      ) : (
        <GoogleMap
          mapContainerClassName="w-full h-full rounded-xl"
          center={ASHLAND_CENTER}
          zoom={zoom}
          options={{
            styles: MAP_STYLES_DARK,
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          <Marker
            position={ASHLAND_CENTER}
            title="SudsOnWheels — Ashland, OH"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#c8102e",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        </GoogleMap>
      )}
    </div>
  );
}
