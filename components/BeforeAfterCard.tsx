import Image from "next/image";

interface BeforeAfterCardProps {
  title: string;
  location: string;
  detail: string;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  beforeLabel?: string | null;
  afterLabel?: string | null;
}

export default function BeforeAfterCard({
  title,
  location,
  detail,
  beforeImageUrl,
  afterImageUrl,
  beforeLabel,
  afterLabel,
}: BeforeAfterCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="grid grid-cols-2">
        <div className="relative h-56 bg-slate-300">
          <span className="absolute top-2 left-2 z-10 rounded bg-black/55 px-2 py-0.5 text-[9px] font-bold text-white">
            BEFORE
          </span>
          {beforeImageUrl ? (
            <Image
              src={beforeImageUrl}
              alt={`${title} before`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <span className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-slate-700">
              {beforeLabel ?? "Before photo coming soon"}
            </span>
          )}
        </div>
        <div className="relative h-56 bg-blue-200">
          <span className="absolute top-2 left-2 z-10 rounded bg-navy px-2 py-0.5 text-[9px] font-bold text-white">
            AFTER
          </span>
          {afterImageUrl ? (
            <Image
              src={afterImageUrl}
              alt={`${title} after`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <span className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-navy">
              {afterLabel ?? "After photo coming soon"}
            </span>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-bold text-navy">{title}</p>
        <p className="mt-0.5 text-[11px] text-gray-400">
          {location} · {detail}
        </p>
      </div>
    </div>
  );
}
