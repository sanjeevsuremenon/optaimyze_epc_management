import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ModuleCard({ module, index }) {
  const getShapeClass = () => {
    // Cycle through different shapes: rect, square, hex, rect
    const shapeIndex = index % 4;
    switch (shapeIndex) {
      case 0:
        return "col-span-1 row-span-1"; // Rectangle
      case 1:
        return "col-span-1 row-span-1 aspect-square"; // Square
      case 2:
        return "col-span-1 row-span-1"; // Hexagon shape
      case 3:
        return "col-span-2 row-span-1 md:col-span-1"; // Wide rectangle
      default:
        return "col-span-1 row-span-1";
    }
  };

  const getColorClass = () => {
    const colors = [
      "from-blue-600 to-blue-800",
      "from-cyan-600 to-cyan-800",
      "from-purple-600 to-purple-800",
      "from-emerald-600 to-emerald-800",
      "from-indigo-600 to-indigo-800",
      "from-rose-600 to-rose-800",
      "from-amber-600 to-amber-800",
      "from-teal-600 to-teal-800",
      "from-pink-600 to-pink-800",
      "from-slate-600 to-slate-800",
      "from-gray-600 to-gray-800",
      "from-zinc-600 to-zinc-800",
    ];
    return colors[index % colors.length];
  };

  const cardContent = (
    <div
      className={`${getShapeClass()} relative overflow-hidden rounded-2xl bg-gradient-to-br ${getColorClass()} shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group`}
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Animated background blob */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-overlay blur-3xl animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-white text-center">
        {module.icon && (
          <div className="mb-4 text-4xl group-hover:scale-125 transition-transform duration-300">
            <FontAwesomeIcon icon={module.icon} />
          </div>
        )}
        <h3 className="font-bold text-lg mb-2 group-hover:text-white transition-colors duration-300">
          {module.label}
        </h3>
        <p className="text-sm opacity-80 group-hover:opacity-100 line-clamp-2">
          {module.description}
        </p>
        {module.badge && (
          <span className="mt-3 inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
            {module.badge}
          </span>
        )}
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-3xl"></div>
    </div>
  );

  if (module.href) {
    return <Link href={module.href}>{cardContent}</Link>;
  }

  return cardContent;
}
