"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  title: string;
  location: string;
  detail: string;
  beforeUrls: string[];
  afterUrls: string[];
  beforeLabel?: string | null;
  afterLabel?: string | null;
}

export default function BeforeAfterCarousel({
  title,
  location,
  detail,
  beforeUrls,
  afterUrls,
  beforeLabel,
  afterLabel,
}: Props) {
  const [index, setIndex] = useState(0);
  const total = Math.max(beforeUrls.length, afterUrls.length);
  const hasMultiple = total > 1;

  const before = beforeUrls[Math.min(index, beforeUrls.length - 1)];
  const after = afterUrls[Math.min(index, afterUrls.length - 1)];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="grid grid-cols-2">
        <PhotoSlot
          url={before}
          label={beforeLabel ?? "Before"}
          labelClass="bg-black/55"
          placeholderClass="bg-slate-300"
          alt={`${title} before`}
        />
        <PhotoSlot
          url={after}
          label={afterLabel ?? "After"}
          labelClass="bg-navy"
          placeholderClass="bg-blue-200"
          alt={`${title} after`}
        />
      </div>

      {hasMultiple && (
        <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 py-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View photo ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-navy" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      <div className={`px-4 py-3 ${hasMultiple ? "" : "border-t border-gray-100"}`}>
        <p className="text-sm font-bold text-navy">{title}</p>
        <p className="mt-0.5 text-[11px] text-gray-400">
          {location} · {detail}
        </p>
      </div>
    </div>
  );
}

function PhotoSlot({
  url,
  label,
  labelClass,
  placeholderClass,
  alt,
}: {
  url: string | undefined;
  label: string;
  labelClass: string;
  placeholderClass: string;
  alt: string;
}) {
  return (
    <div className={`relative flex h-48 items-center justify-center ${placeholderClass}`}>
      <span
        className={`absolute top-2 left-2 z-10 rounded px-2 py-0.5 text-[9px] font-bold uppercase text-white ${labelClass}`}
      >
        {label}
      </span>
      {url ? (
        <Image
          key={url}
          src={url}
          alt={alt}
          fill
          className="object-cover [animation:gallery-fade_0.18s_ease-out]"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      ) : (
        <span className="px-4 text-center text-xs font-semibold text-slate-600">
          Photo coming soon
        </span>
      )}
    </div>
  );
}
