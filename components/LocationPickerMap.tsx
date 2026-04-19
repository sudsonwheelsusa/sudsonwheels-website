"use client";

import { divIcon, type LatLngLiteral } from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { MAP_DEFAULT_CENTER } from "@/lib/constants/site";

const pinIcon = divIcon({
  className: "location-pin-wrapper",
  html: '<span class="location-pin-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapClickHandler({
  onChange,
}: {
  onChange: (value: LatLngLiteral) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function LocationPickerMap({
  value,
  onChange,
}: {
  value: LatLngLiteral | null;
  onChange: (value: LatLngLiteral) => void;
}) {
  return (
    <MapContainer
      center={value ?? MAP_DEFAULT_CENTER}
      zoom={value ? 15 : 10}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onChange={onChange} />
      {value ? <Marker position={value} icon={pinIcon} /> : null}
    </MapContainer>
  );
}
