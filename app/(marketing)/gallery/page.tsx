import type { Metadata } from "next";
import Link from "next/link";
import { getPublicGallery, getPublicGalleryVideos } from "@/lib/site-data";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import PageHeader from "@/components/PageHeader";
import ScrollReveal from "@/components/ScrollReveal";

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
      <PageHeader
        breadcrumb="Gallery"
        eyebrow="Our Work"
        title="Before & After"
        subtitle="Real jobs, real results. Swipe through before-and-after photos and watch us in action."
      />

      <section className="bg-offwhite px-6 py-14">
        <div className="mx-auto max-w-6xl">
          {items.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <div key={item.id} className={`reveal reveal-delay-${(i % 3) + 1}`}>
                  <BeforeAfterSlider
                    title={item.title}
                    location={item.location}
                    detail={item.detail}
                    beforeUrls={item.before_image_urls ?? []}
                    afterUrls={item.after_image_urls ?? []}
                    beforeLabel={item.before_label}
                    afterLabel={item.after_label}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="reveal py-16 text-center">
              <p className="text-5xl mb-4">📸</p>
              <p className="text-lg font-bold text-navy mb-2">Photos coming soon</p>
              <p className="text-gray-500">We&apos;re adding job photos regularly — follow us on Instagram for the latest.</p>
            </div>
          )}

          {/* Social CTA */}
          <div className="reveal mt-12 rounded-2xl border border-gray-100 bg-white px-8 py-8 text-center shadow-sm">
            <p className="text-3xl mb-3">📸</p>
            <h3 className="mb-1 text-xl font-black text-navy">More fresh job photos on social</h3>
            <p className="mb-5 text-gray-500">
              We post every big job on Instagram and TikTok — follow along{" "}
              <strong>@suds_on_wheels</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://www.instagram.com/suds_on_wheels/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-brand-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-red/90"
              >
                Instagram →
              </a>
              <a
                href="https://www.tiktok.com/@suds_on_wheels"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border-2 border-navy px-5 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white"
              >
                TikTok →
              </a>
            </div>
          </div>
        </div>
      </section>

      {videos.length > 0 && (
        <section className="bg-white px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="reveal mb-8 text-2xl font-black text-navy">See Us in Action</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {videos.map((video, i) => (
                <div key={video.id} className={`reveal reveal-delay-${(i % 2) + 1} overflow-hidden rounded-xl bg-black`}>
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
                    <p className="px-4 py-3 text-sm font-semibold text-white">{video.title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-gray-100 bg-offwhite px-6 py-14 text-center">
        <h2 className="reveal mb-3 text-2xl font-black text-navy">Want results like these?</h2>
        <p className="reveal reveal-delay-1 mb-6 text-base text-gray-500">Free estimates — we&apos;ll get back to you fast.</p>
        <Link
          href="/contact"
          className="reveal reveal-delay-2 inline-block rounded-lg bg-brand-red px-6 py-3 text-base font-bold text-white transition-colors hover:bg-brand-red/90"
        >
          Get a Free Quote
        </Link>
      </section>

      <ScrollReveal />
    </main>
  );
}
