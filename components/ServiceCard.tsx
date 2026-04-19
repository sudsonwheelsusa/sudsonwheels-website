import { ServiceIcon } from "@/lib/service-icons";

interface ServiceCardProps {
  name: string;
  description: string;
  icon?: string | null;
}

export default function ServiceCard({ name, description, icon }: ServiceCardProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="bg-slate-200 h-36 flex items-center justify-center relative">
        <ServiceIcon name={icon} className="size-12 text-navy" />
      </div>
      <div className="p-4">
        <h3 className="text-navy font-bold text-sm mb-1.5">{name}</h3>
        <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
