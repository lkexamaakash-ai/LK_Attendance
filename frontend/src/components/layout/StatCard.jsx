import React from "react";

const tones = {
  maroon: "bg-maroon-50 text-maroon-700",
  gold: "bg-gold-100 text-gold-600",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

// Summary tile for dashboards: icon, small label and a large value.
const StatCard = ({ label, icon: Icon, tone = "maroon", children, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
      onClick ? "cursor-pointer" : ""
    }`}
  >
    {Icon && (
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.maroon}`}
      >
        <Icon className="size-6" />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-0.5 truncate text-2xl font-semibold text-slate-900">
        {children}
      </div>
    </div>
  </div>
);

export default StatCard;
