"use client";
import axios from "axios";
import { mainRoute } from "@/components/apiroute";

export const getAuth = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("user"));
    return { token: stored?.data?.token, user: stored?.data?.user };
  } catch {
    return {};
  }
};

// Calls the backend with the logged-in user's token.
export const api = (method, url, data, params) => {
  const { token } = getAuth();
  return axios({
    method,
    url: `${mainRoute}/api/${url}`,
    data,
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const errorText = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || fallback;

// Dates from the server are plain dates (no time), so show them in UTC to avoid shifting a day.
export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "-";

export const dateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");

export const todayInput = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const addMonths = (dateStr, months) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  // keep the same day-of-month where possible (e.g. 31 Jan + 1 month -> end of Feb)
  if (date.getUTCDate() !== d) date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
};

export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "S";

const tone = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EXPIRING: "bg-amber-50 text-amber-700 ring-amber-200",
  EXPIRED: "bg-red-50 text-red-700 ring-red-200",
  NONE: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const daysLabel = (e) => {
  if (!e) return "No course";
  if (e.daysLeft < 0) return `Expired ${Math.abs(e.daysLeft)} day${Math.abs(e.daysLeft) === 1 ? "" : "s"} ago`;
  if (e.daysLeft === 0) return "Ends today";
  return `${e.daysLeft} day${e.daysLeft === 1 ? "" : "s"} left`;
};

export const DaysBadge = ({ enrollment }) => (
  <span
    className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
      tone[enrollment?.status || "NONE"]
    }`}
  >
    {daysLabel(enrollment)}
  </span>
);

export const ModalShell = ({ title, subtitle, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-maroon-900/40 p-3 backdrop-blur-[2px]">
    <div
      className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl ${
        wide ? "max-w-3xl" : "max-w-xl"
      }`}
    >
      <div className="flex items-start justify-between border-b border-stone-100 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-maroon-800">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

export const Field = ({ label, children, className = "" }) => (
  <label className={`flex flex-col gap-1.5 ${className}`}>
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {children}
  </label>
);

export const inputClass =
  "h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-slate-900 shadow-xs outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-300/50 disabled:bg-stone-50 disabled:text-slate-500";
