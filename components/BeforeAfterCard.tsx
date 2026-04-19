interface BeforeAfterCardProps {
  title: string;
  location: string;
  detail: string;
  beforeIcon: string;
  afterIcon: string;
}

export default function BeforeAfterCard({
  title,
  location,
  detail,
  beforeIcon,
  afterIcon,
}: BeforeAfterCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="grid grid-cols-2">
        <div className="bg-slate-300 h-28 flex items-center justify-center relative">
          {/* Replace with <Image src={beforeSrc} alt="Before" fill className="object-cover" /> */}
          <span className="absolute top-2 left-2 bg-black/55 text-white text-[9px] font-bold px-2 py-0.5 rounded">
            BEFORE
          </span>
          <span className="text-3xl" role="img" aria-label="before">
            {beforeIcon}
          </span>
        </div>
        <div className="bg-blue-200 h-28 flex items-center justify-center relative">
          {/* Replace with <Image src={afterSrc} alt="After" fill className="object-cover" /> */}
          <span className="absolute top-2 left-2 bg-navy text-white text-[9px] font-bold px-2 py-0.5 rounded">
            AFTER
          </span>
          <span className="text-3xl" role="img" aria-label="after">
            {afterIcon}
          </span>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-navy font-bold text-sm">{title}</p>
        <p className="text-gray-400 text-[11px] mt-0.5">
          {location} · {detail}
        </p>
      </div>
    </div>
  );
}
