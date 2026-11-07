"use client";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = {
  Conducted: "#2f855a",
  "Pre cancelled": "#c62828",
  Penalties: "#c0922f",
};

// Simple bar chart of lecture outcomes for the admin dashboards.
const LectureOverviewChart = ({ conducted = 0, missed = 0, penalties = 0 }) => {
  const data = [
    { name: "Conducted", value: conducted },
    { name: "Pre cancelled", value: missed },
    { name: "Penalties", value: penalties },
  ];

  return (
    <div className="mt-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Lecture overview</h2>
      <p className="mb-4 text-xs text-slate-500">
        Conducted, pre-cancelled and penalized lectures
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={56}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7dfdc" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "#fcf4f5" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.name} fill={colors[d.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LectureOverviewChart;
