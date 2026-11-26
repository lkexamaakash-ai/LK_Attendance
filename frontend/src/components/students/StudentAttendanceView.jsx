"use client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import EmptyState from "../layout/EmptyState";
import { api, errorText, formatDate } from "./shared";

// A student's own attendance, grouped by batch.
const StudentAttendanceView = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("get", "studentAttendance/me")
      .then(({ data }) => setBatches(data.data || []))
      .catch((err) => toast.error(errorText(err, "Could not load your attendance")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="m-6 text-sm text-slate-500">Loading...</p>;

  return (
    <div className="m-2 h-[91%] space-y-4 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      {batches.length === 0 ? (
        <EmptyState message="No attendance recorded yet" />
      ) : (
        batches.map((b) => (
          <div key={b.batchId} className="rounded-lg border border-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3">
              <div>
                <p className="font-semibold text-maroon-800">{b.batchName}</p>
                <p className="text-xs text-slate-500">
                  {b.course} · {b.branch}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-maroon-800">{b.percentage}%</p>
                <p className="text-xs text-slate-500">
                  {b.present} present · {b.absent} absent
                </p>
              </div>
            </div>
            <ul className="max-h-72 divide-y divide-stone-100 overflow-y-auto">
              {b.records.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                  <span className="text-slate-700">
                    {formatDate(r.date)} · {r.subject}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {r.status === "PRESENT" ? "Present" : "Absent"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default StudentAttendanceView;
