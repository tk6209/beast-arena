import { CAPYNITE_BRAND } from "@/brand/capynite";

interface UniverseMarkProps {
  compact?: boolean;
  align?: "left" | "center";
}

export default function UniverseMark({ compact = false, align = "left" }: UniverseMarkProps) {
  return (
    <div
      aria-label={`${CAPYNITE_BRAND.name} ${CAPYNITE_BRAND.edition}`}
      className={`inline-flex ${align === "center" ? "items-center text-center" : "items-start text-left"} flex-col`}
    >
      <span className="font-['Bebas_Neue'] text-[10px] sm:text-xs tracking-[0.34em] text-white/45">
        {CAPYNITE_BRAND.edition}
      </span>
      <span
        className={`font-['Bebas_Neue'] font-black tracking-[0.08em] text-white ${compact ? "text-lg" : "text-2xl sm:text-3xl"}`}
        style={{ textShadow: "0 0 22px rgba(56,225,255,.24)" }}
      >
        {CAPYNITE_BRAND.name}
      </span>
    </div>
  );
}
