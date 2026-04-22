import type { Metadata } from "next";
import Link from "next/link";
import { getPublicGallery, getPublicGalleryVideos } from "@/lib/site-data";
import BeforeAfterCarousel from "@/components/BeforeAfterCarousel";

export const metadata: Metadata = {
  title: "Gallery | SudsOnWheels",
  description:
    "See our pressure washing results — before and after photos of fleet washes, farm equipment, and more in Ashland, OH.",
};

export default async function GalleryPage() {
  const [items, videos] = await Promise.all([
    getPublicGallery(),
    getPublicGalleryVideos(),
  ]);

  return (
    <main>
      <section className="bg-navy px-6 py-14 text-center">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
          Our Work
        </p>
        <h1 className="text-4xl font-black text-offwhite">Results That Speak</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-blue-200/70">
          Real jobs, real results. Swipe through before-and-after photos and watch us in action.
        </p>
      </section>

      {items.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="mb-8 text-2xl font-black text-navy">Before &amp; After</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <BeforeAfterCarousel
                key={item.id}
                title={item.title}
                location={item.location}
                detail={item.detail}
                beforeUrls={item.before_image_urls ?? []}
                afterUrls={item.after_image_urls ?? []}
                beforeLabel={item.before_label}
                afterLabel={item.after_label}
              />
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50 px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-2xl font-black text-navy">See Us in Action</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {videos.map((video) => (
                <div key={video.id} className="overflow-hidden rounded-xl bg-black">
                  {video.video_url && (
                    <video
                      src={video.video_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full"
                      aria-label={video.title}
                    />
                  )}
                  {video.title && (
                    <p className="px-4 py-3 text-sm font-semibold text-white">
                      {video.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-gray-100 px-6 py-16 text-center">
        <h2 className="mb-3 text-2xl font-black text-navy">Want results like these?</h2>
        <p className="mb-8 text-base text-gray-500">Free estimates — we&apos;ll get back to you fast.</p>
        <Link
          href="/contact"
          className="rounded-md bg-brand-red px-6 py-3 text-base font-bold text-white transition-colors hover:bg-brand-red/90"
        >
          Get a Free Quote
        </Link>
      </section>
    </main>
  );
}
