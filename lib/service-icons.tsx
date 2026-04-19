import {
  ArrowDownToLine,
  CircleHelp,
  Droplets,
  Home,
  House,
  Sparkles,
  Trees,
  Truck,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  ArrowDownToLine,
  Droplets,
  Home,
  House,
  Sparkles,
  Trees,
  Truck,
};

export const SERVICE_ICON_OPTIONS = [
  "House",
  "Droplets",
  "Trees",
  "ArrowDownToLine",
  "Truck",
  "Home",
  "Sparkles",
] as const;

export function ServiceIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}

export function FallbackServiceIcon({ className }: { className?: string }) {
  return <CircleHelp className={className} aria-hidden="true" />;
}
