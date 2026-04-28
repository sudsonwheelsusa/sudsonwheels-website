"use client";

import { useEffect, useRef, useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const EMBED_SRC = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=40.8648,-82.3165&zoom=13`;

const SIZE_CLASSES = {
  sm: "h-[200px]",
  md: "h-[360px]",
} as const;

interface MapEmbedProps {
  size?: keyof typeof SIZE_CLASSES;
}

export default function MapEmbed({ size = "md" }: MapEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`${SIZE_CLASSES[size]} w-full`}>
      {inView ? (
        <iframe
          src={EMBED_SRC}
          className="h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="SudsOnWheels service area — Ashland, OH"
        />
      ) : (
        <div className="h-full animate-pulse rounded-xl bg-navy/10" />
      )}
    </div>
  );
}
