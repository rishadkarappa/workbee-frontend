import type { FC } from "react";
import {
  Truck,
  Wrench,
  SprayCan,
  Hammer,
  Users,
  ShoppingCart,
  PaintRoller,
  Boxes,
  Home,
  Package,
} from "lucide-react";

interface FloatingIconsProps {
  className?: string;
}

type IconSpec = {
  Icon: typeof Truck;
  label: string;
  top: string;
  left: string;
  size: "sm" | "md" | "lg";
  delay: number;
  duration: number;
  colorLight: string;
  colorDark: string;
  bgLight: string;
  bgDark: string;
};

// Each icon maps to a real WorkBee category, positioned as percentages so the
// whole cluster scales fluidly instead of breaking on smaller viewports.
const ICONS: IconSpec[] = [
  { Icon: Truck, label: "Flat moving", top: "8%", left: "12%", size: "lg", delay: 0, duration: 6.5, colorLight: "text-orange-600", colorDark: "dark:text-orange-300", bgLight: "bg-orange-50", bgDark: "dark:bg-orange-500/10" },
  { Icon: Wrench, label: "Furniture assembly", top: "4%", left: "62%", size: "md", delay: 0.6, duration: 5.5, colorLight: "text-blue-600", colorDark: "dark:text-blue-300", bgLight: "bg-blue-50", bgDark: "dark:bg-blue-500/10" },
  { Icon: SprayCan, label: "Cleaning", top: "22%", left: "84%", size: "lg", delay: 1.1, duration: 7, colorLight: "text-teal-600", colorDark: "dark:text-teal-300", bgLight: "bg-teal-50", bgDark: "dark:bg-teal-500/10" },
  { Icon: Hammer, label: "Mounting", top: "38%", left: "4%", size: "md", delay: 1.8, duration: 6, colorLight: "text-amber-600", colorDark: "dark:text-amber-300", bgLight: "bg-amber-50", bgDark: "dark:bg-amber-500/10" },
  { Icon: Users, label: "Helping hands", top: "48%", left: "48%", size: "lg", delay: 0.3, duration: 6.8, colorLight: "text-rose-600", colorDark: "dark:text-rose-300", bgLight: "bg-rose-50", bgDark: "dark:bg-rose-500/10" },
  { Icon: ShoppingCart, label: "Purchasing", top: "18%", left: "36%", size: "sm", delay: 2.2, duration: 5.2, colorLight: "text-emerald-600", colorDark: "dark:text-emerald-300", bgLight: "bg-emerald-50", bgDark: "dark:bg-emerald-500/10" },
  { Icon: PaintRoller, label: "Painting", top: "66%", left: "18%", size: "sm", delay: 1.4, duration: 6.2, colorLight: "text-violet-600", colorDark: "dark:text-violet-300", bgLight: "bg-violet-50", bgDark: "dark:bg-violet-500/10" },
  { Icon: Boxes, label: "Packing", top: "70%", left: "70%", size: "md", delay: 0.9, duration: 5.8, colorLight: "text-cyan-600", colorDark: "dark:text-cyan-300", bgLight: "bg-cyan-50", bgDark: "dark:bg-cyan-500/10" },
  { Icon: Home, label: "Home tasks", top: "82%", left: "42%", size: "sm", delay: 1.6, duration: 6.4, colorLight: "text-indigo-600", colorDark: "dark:text-indigo-300", bgLight: "bg-indigo-50", bgDark: "dark:bg-indigo-500/10" },
  { Icon: Package, label: "Delivery", top: "58%", left: "90%", size: "sm", delay: 2.5, duration: 5.6, colorLight: "text-fuchsia-600", colorDark: "dark:text-fuchsia-300", bgLight: "bg-fuchsia-50", bgDark: "dark:bg-fuchsia-500/10" },
];

const SIZE_MAP: Record<IconSpec["size"], { box: string; icon: string; hideOnMobile: boolean }> = {
  sm: { box: "w-9 h-9 sm:w-10 sm:h-10", icon: "h-4 w-4 sm:h-5 sm:w-5", hideOnMobile: true },
  md: { box: "w-10 h-10 sm:w-12 sm:h-12", icon: "h-5 w-5 sm:h-6 sm:w-6", hideOnMobile: false },
  lg: { box: "w-12 h-12 sm:w-14 sm:h-14", icon: "h-6 w-6 sm:h-7 sm:w-7", hideOnMobile: false },
};

const FloatingIcons: FC<FloatingIconsProps> = ({ className = "" }) => {
  return (
    <div
      className={`relative w-full h-72 sm:h-96 ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes wb-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wb-float { animation: none !important; }
        }
      `}</style>

      {ICONS.map(({ Icon, label, top, left, size, delay, duration, colorLight, colorDark, bgLight, bgDark }, i) => {
        const s = SIZE_MAP[size];
        return (
          <div
            key={i}
            title={label}
            className={`wb-float absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 border border-black/5 dark:border-white/10 flex items-center justify-center backdrop-blur-sm transition-transform duration-300 hover:scale-110 hover:-rotate-3 ${s.box} ${bgLight} ${bgDark} ${s.hideOnMobile ? "hidden sm:flex" : "flex"}`}
            style={{
              top,
              left,
              animation: `wb-float ${duration}s ease-in-out ${delay}s infinite`,
            }}
          >
            <Icon className={`${s.icon} ${colorLight} ${colorDark}`} strokeWidth={2} />
          </div>
        );
      })}
    </div>
  );
};

export default FloatingIcons;