import { Wrench } from "lucide-react";

interface ShopPlaceholderProps {
  title: string;
  description?: string;
}

export default function ShopPlaceholder({
  title,
  description = "หน้านี้อยู่ระหว่างพัฒนา",
}: ShopPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 shadow-sm">
        <Wrench size={36} className="text-orange-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>
      <span className="mt-6 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold">
        Coming Soon
      </span>
    </div>
  );
}
