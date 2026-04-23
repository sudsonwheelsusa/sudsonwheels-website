"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export default function BeforeAfterSlider({
  title,
  location,
  detail,
  beforeUrls,
  afterUrls,
  beforeLabel,
  afterLabel,
}: Props) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const total = Math.max(beforeUrls.length, afterUrls.length);
  const before = beforeUrls[Math.min(imgIndex, beforeUrls.length - 1)];
  const after = afterUrls[Math.min(imgIndex, afterUrls.length - 1)];

  const calcPosition = useCallback((clientX: number) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onTouchStart = () => setDragging(true);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => calcPosition(e.clientX);
    const onTouchMove = (e: TouchEvent) => calcPosition(e.touches[0].clientX);
    const stop = () => setDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stop);
    };
  }, [dragging, calcPosition]);

  const handleClick = (e: React.MouseEvent) => {
    // only move on direct wrapper click, not on handle drag
    if (!dragging) calcPosition(e.clientX);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Slider */}
      <div
        ref={wrapRef}
        className="relative h-60 cursor-col-resize select-none overflow-hidden"
        onClick={handleClick}
      >
        {/* Before (full width) */}
        <div className="absolute inset-0">
          {before ? (
            <Image
              key={before}
              src={before}
              alt={`${title} before`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full bg-slate-300" />
          )}
          {/* Before label */}
          <span className="absolute left-2 top-2 rounded bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {beforeLabel ?? "Before"}
          </span>
        </div>

        {/* After (clipped) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {after ? (
            <Image
              key={after}
              src={after}
              alt={`${title} after`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full bg-blue-200" />
          )}
          {/* After label */}
          <span className="absolute right-2 top-2 rounded bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {afterLabel ?? "After"}
          </span>
        </div>

        {/* Divider line */}
        <div
          className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-lg"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          {/* Handle */}
          <button
            type="button"
            aria-label="Drag to compare before and after"
            className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            <svg className="h-4 w-4 text-navy" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5L6.5 6.5 10.086 10H3v4h7.086L6.5 17.5 8 19l7-7-7-7zm8 14l1.5-1.5L13.914 14H21v-4h-7.086L17.5 6.5 16 5l-7 7 7 7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Multi-photo dots */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 py-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setImgIndex(i)}
              aria-label={`View photo set ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === imgIndex ? "w-5 bg-navy" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}

      {/* Info card */}
      <div className="px-5 py-4">
        <p className="mb-0.5 text-xs font-bold text-brand-red">📍 {location}</p>
        <p className="font-bold text-navy">{title}</p>
        {detail && <p className="mt-1 text-sm leading-relaxed text-gray-500">{detail}</p>}
      </div>
    </div>
  );
}
