"use client";

import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { useCallback, useState } from "react";

export type LatLng = { lat: number; lng: number };

const DEFAULT_CENTER: LatLng = { lat: 40.8648, lng: -82.3165 };

interface Props {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
}

export default function LocationPickerMap({ value, onChange }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    id: "sow-google-map-script",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);
  void map;

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    },
    [onChange]
  );

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Map unavailable
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="h-full animate-pulse bg-slate-100" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={value ?? DEFAULT_CENTER}
      zoom={value ? 15 : 10}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        clickableIcons: false,
      }}
      onClick={handleClick}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {value && (
        <OverlayView position={value} mapPaneName={OverlayView.OVERLAY_LAYER}>
          <div className="size-4.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white bg-[#c8102e] pointer-events-none" />
        </OverlayView>
      )}
    </GoogleMap>
  );
}
