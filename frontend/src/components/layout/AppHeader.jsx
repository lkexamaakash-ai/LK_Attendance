"use client";
import { Menu } from "lucide-react";
import React, { useEffect, useState } from "react";

const roleNames = {
  SUPER_ADMIN: "Super Admin",
  BRANCH_ADMIN: "Branch Admin",
  FACULTY: "Faculty",
  STAFF: "Staff",
};

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

// Shared top bar for every role.
const AppHeader = ({ title, setOpen }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.data?.user || parsed.user || parsed);
      }
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <header className="mx-1 mt-1 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-1.5 shadow-sm sm:px-6">
      <div className="flex items-center gap-2">
        {setOpen && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-maroon-700 hover:bg-maroon-50 xl:hidden"
          >
            <Menu className="size-5" />
          </button>
        )}
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
          {title}
        </h1>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-gold-600">
              {roleNames[user.role] || user.role}
            </p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-maroon-700 text-sm font-semibold text-white ring-2 ring-gold-300">
            {initialsOf(user.name)}
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
