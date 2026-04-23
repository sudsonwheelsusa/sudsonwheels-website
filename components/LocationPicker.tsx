"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { LatLng } from "@/components/LocationPickerMap";
import { Button } from "@/components/ui/button";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-500">
      Loading map...
    </div>
  ),
});

export type { LatLng };

export default function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
}) {
  const [geoStatus, setGeoStatus] = useState("");

  function useCurrentLocation() {
    setGeoStatus("");

    if (!navigator.geolocation) {
      setGeoStatus("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus("Current location added.");
      },
      () => {
        setGeoStatus("We couldn't access your current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="h-64 w-full">
          <LocationPickerMap value={value} onChange={onChange} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation}>
          Use current location
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Clear pin
        </Button>
        {value ? (
          <span className="text-xs text-slate-500">
            Pin: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        ) : null}
      </div>

      {geoStatus ? <p className="text-xs text-slate-500">{geoStatus}</p> : null}
    </div>
  );
}
