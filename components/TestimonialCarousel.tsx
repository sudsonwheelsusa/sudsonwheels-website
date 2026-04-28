"use client";

import { useState, useEffect } from "react";

const TESTIMONIALS = [
  {
    quote: "These guys handle the fleet washing for Valley Transportation and I've seen the work up close. Fast, thorough, professional every single time. Our trucks always look sharp leaving the yard.",
    name: "Valley Transportation",
    location: "Ashland, OH — Commercial Contract",
  },
  {
    quote: "We brought SudsOnWheels in for our facility at Scott's Industry and the results were exactly what we needed. Dependable, efficient, and they got it done right without disrupting our operation.",
    name: "Scott's Industry",
    location: "Wooster, OH — Commercial Contract",
  },
];

export default function TestimonialCarousel() {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setIndex((i) => (i + 1) % TESTIMONIALS.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const t = TESTIMONIALS[index];

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mb-6 text-lg text-amber-400 tracking-widest">★★★★★</div>

      {/* Card */}
      <div key={index} className="testi-card-animate relative rounded-2xl border border-white/10 bg-white/6 px-8 py-8 mb-6">
        <span className="absolute -top-3 left-6 font-serif text-6xl leading-none text-brand-red/25 select-none">&ldquo;</span>
        <p className="relative z-10 mb-6 text-lg leading-relaxed text-white/85 italic">{t.quote}</p>
        <p className="font-bold text-white">{t.name}</p>
        <p className="mt-1 text-sm text-white/45">{t.location}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous testimonial"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-brand-red hover:text-white"
        >
          ←
        </button>

        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-brand-red" : "w-2 bg-white/25"}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next testimonial"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-brand-red hover:text-white"
        >
          →
        </button>
      </div>
    </div>
  );
}
