export const themeOptions = [
  {
    value: "default",
    label: "Default",
    description: "Classic centered profile",
    swatch: "from-indigo-600 to-blue-600",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Clean monochrome card",
    swatch: "from-gray-800 to-gray-950",
  },
  {
    value: "modern",
    label: "Modern",
    description: "Bright gradient profile",
    swatch: "from-violet-600 via-fuchsia-600 to-sky-600",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Deep contrast layout",
    swatch: "from-slate-700 to-slate-950",
  },
  {
    value: "signature",
    label: "Signature",
    description: "Premium editorial card",
    swatch: "from-[#101815] to-[#b9f27c]",
  },
  {
    value: "executive",
    label: "Executive",
    description: "Sharp business profile",
    swatch: "from-[#171717] to-[#d7c39a]",
  },
  {
    value: "aurora",
    label: "Aurora",
    description: "Portrait-forward design",
    swatch: "from-emerald-500 via-sky-500 to-fuchsia-500",
  },
  {
    value: "sunrise",
    label: "Sunrise",
    description: "Cover-first social card",
    swatch: "from-rose-500 via-orange-400 to-amber-300",
  },
  {
    value: "heritage",
    label: "Heritage",
    description: "Warm vCard-inspired style",
    swatch: "from-[#6f442c] to-[#f6efe8]",
  },
];

type ThemePreviewProps = {
  value: string;
  swatch: string;
};

export function ThemePreview({ value, swatch }: ThemePreviewProps) {
  const isEditorial = value === "signature" || value === "executive";
  const isPortrait = value === "aurora" || value === "sunrise";
  const isHeritage = value === "heritage";
  const darkCard =
    value === "dark" || value === "signature" || value === "executive";

  if (isHeritage) {
    return (
      <div className="h-32 overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className={`relative h-16 bg-gradient-to-br ${swatch}`}>
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute left-1/2 top-5 h-10 w-10 -translate-x-1/2 rounded-full border-2 border-white bg-white/80" />
        </div>
        <div
          className="-mt-3 bg-white px-3 pb-3 pt-5"
          style={{ clipPath: "polygon(0 13%, 100% 0, 100% 100%, 0 100%)" }}
        >
          <div className="mx-auto mb-2 h-2 w-20 rounded-full bg-[#8b5638]" />
          <div className="grid grid-cols-3 gap-1">
            <div className="h-6 rounded bg-[#f8f1ec]" />
            <div className="h-6 rounded bg-[#f8f1ec]" />
            <div className="h-6 rounded bg-[#f8f1ec]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-32 overflow-hidden rounded-lg border bg-gradient-to-br ${swatch} p-3 shadow-sm`}
    >
      <div
        className={`h-full rounded-lg ${
          darkCard ? "bg-black/35" : "bg-white/80"
        } p-3`}
      >
        <div
          className={`mb-3 h-8 w-8 rounded-full ${
            darkCard ? "bg-white/80" : "bg-white"
          } ${isPortrait ? "ml-auto" : ""}`}
        />
        <div
          className={`mb-2 h-2 rounded-full ${
            isEditorial ? "w-24" : "mx-auto w-20"
          } ${darkCard ? "bg-white/70" : "bg-gray-700"}`}
        />
        <div
          className={`mb-2 h-2 rounded-full ${
            isEditorial ? "w-20" : "mx-auto w-16"
          } ${darkCard ? "bg-white/45" : "bg-gray-400"}`}
        />
        <div
          className={`h-2 rounded-full ${
            isEditorial ? "w-16" : "mx-auto w-14"
          } ${darkCard ? "bg-white/30" : "bg-gray-300"}`}
        />
      </div>
    </div>
  );
}
