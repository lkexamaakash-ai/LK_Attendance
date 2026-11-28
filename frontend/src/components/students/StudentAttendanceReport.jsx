"use client";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import EmptyState from "../layout/EmptyState";
import { api, errorText, formatDate } from "./shared";

const isoToday = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
const isoDaysAgo = (n) => new Date(Date.now() + 5.5 * 60 * 60 * 1000 - n * 86400000).toISOString().slice(0, 10);

const timeOf = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" })
    : "";

const tone = (pct) => (pct >= 75 ? "text-green-700" : pct >= 50 ? "text-amber-700" : "text-red-700");

const inputCls = "mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm";

// Attendance report: by lecture and by student, for a range of dates.
// Faculty see their own lectures, a branch admin the lectures of their branch, a super admin all.
const StudentAttendanceReport = ({ role, embedded = false }) => {
  const isFaculty = role === "FACULTY";
  const isSuper = role === "SUPER_ADMIN";

  const [from, setFrom] = useState(isoDaysAgo(6));
  const [to, setTo] = useState(isoToday());
  const [branchId, setBranchId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);

  const [tab, setTab] = useState("lectures");
  const [lectures, setLectures] = useState(null);
  const [students, setStudents] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openKey, setOpenKey] = useState(null); // lecture + date whose names are shown
  const [names, setNames] = useState({}); // key -> { present: [], absent: [] }

  useEffect(() => {
    if (!isSuper) return;
    api("get", "branch")
      .then(({ data }) => setBranches(data.data || []))
      .catch(() => {});
  }, [isSuper]);

  useEffect(() => {
    api("get", "studentAttendance/report/filters", null, { branchId: branchId || undefined })
      .then(({ data }) => setBatches(data.data || []))
      .catch(() => setBatches([]));
  }, [branchId]);

  const load = useCallback(async () => {
    if (from > to) return toast.error("The from date cannot be after the to date");
    try {
      setLoading(true);
      const params = { from, to, branchId: branchId || undefined, batchId: batchId || undefined };
      const [a, b] = await Promise.all([
        api("get", "studentAttendance/report", null, params),
        api("get", "studentAttendance/report/students", null, params),
      ]);
      setLectures(a.data.data);
      setStudents(b.data.data);
      setOpenKey(null);
      setNames({});
    } catch (err) {
      toast.error(errorText(err, "Could not load the report"));
    } finally {
      setLoading(false);
    }
  }, [from, to, branchId, batchId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRow = async (r) => {
    const key = `${r.lectureId}|${r.date}`;
    if (openKey === key) return setOpenKey(null);
    setOpenKey(key);
    if (names[key]) return;
    try {
      const { data } = await api("get", "studentAttendance/sheet", null, { lectureId: r.lectureId, date: r.date });
      const list = data.data.students;
      setNames((m) => ({
        ...m,
        [key]: {
          present: list.filter((s) => s.status === "PRESENT").map((s) => s.name),
          absent: list.filter((s) => s.status === "ABSENT").map((s) => s.name),
        },
      }));
    } catch (err) {
      toast.error(errorText(err, "Could not load the names"));
    }
  };

  const download = () => {
    if (!lectures || !students) return;
    const wb = XLSX.utils.book_new();
    const lectureRows = lectures.rows.map((r) => ({
      Date: r.date,
      Time: `${timeOf(r.startTime)} - ${timeOf(r.endTime)}`,
      Subject: r.subject,
      Batch: r.batch,
      Course: r.course,
      Branch: r.branch,
      Faculty: r.faculty,
      Present: r.present,
      Absent: r.absent,
      Total: r.total,
      "Attendance %": r.percentage,
    }));
    const studentRows = students.map((s) => ({
      Name: s.name,
      Phone: s.phoneNumber,
      Present: s.present,
      Absent: s.absent,
      Total: s.total,
      "Attendance %": s.percentage,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lectureRows), "By lecture");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), "By student");
    XLSX.writeFile(wb, `student-attendance-${from}-to-${to}.xlsx`);
  };

  const t = lectures?.totals;

  return (
    <div
      className={
        embedded
          ? "space-y-4"
          : "m-2 h-[91%] space-y-4 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-600">
          From
          <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className={inputCls} />
        </label>
        <label className="text-sm text-slate-600">
          To
          <input type="date" value={to} max={isoToday()} onChange={(e) => e.target.value && setTo(e.target.value)} className={inputCls} />
        </label>
        {isSuper && (
          <label className="text-sm text-slate-600">
            Branch
            <select
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setBatchId("");
              }}
              className={inputCls}
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm text-slate-600">
          Batch
          <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className={inputCls}>
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.course}
              </option>
            ))}
          </select>
        </label>
        <Button onClick={load} disabled={loading} className="cursor-pointer">
          {loading ? "Loading..." : "Show report"}
        </Button>
        <Button variant="outline" onClick={download} disabled={!lectures || lectures.rows.length === 0} className="cursor-pointer">
          <Download className="size-4" /> Excel
        </Button>
      </div>

      {t && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Lectures marked", t.lectures],
            ["Present", t.present],
            ["Absent", t.absent],
            ["Attendance", `${t.percentage}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-2xl font-semibold text-maroon-800">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {[
          ["lectures", "By lecture"],
          ["students", "By student"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm ${
              tab === key ? "border-maroon-700 bg-maroon-50 font-medium text-maroon-800" : "border-stone-300 text-slate-700 hover:border-maroon-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && !lectures ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : tab === "lectures" ? (
        !lectures || lectures.rows.length === 0 ? (
          <EmptyState message="No attendance has been marked in these dates" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-maroon-50 text-xs uppercase tracking-wide text-maroon-800">
                <tr>
                  <th className="w-8 px-2 py-3" />
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Lecture</th>
                  <th className="px-3 py-3 font-semibold">Batch</th>
                  {!isFaculty && <th className="px-3 py-3 font-semibold">Faculty</th>}
                  <th className="px-3 py-3 text-right font-semibold">Present</th>
                  <th className="px-3 py-3 text-right font-semibold">Absent</th>
                  <th className="px-3 py-3 text-right font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {lectures.rows.map((r) => {
                  const key = `${r.lectureId}|${r.date}`;
                  const open = openKey === key;
                  return (
                    <React.Fragment key={key}>
                      <tr onClick={() => toggleRow(r)} className="cursor-pointer border-t border-stone-100 hover:bg-stone-50">
                        <td className="px-2 py-3 text-slate-400">{open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</td>
                        <td className="px-3 py-3 whitespace-nowrap">{formatDate(r.date)}</td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-800">{r.subject}</p>
                          <p className="text-xs text-slate-500">
                            {timeOf(r.startTime)} - {timeOf(r.endTime)}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          {r.batch}
                          <span className="block text-xs text-slate-500">
                            {r.course}
                            {isSuper && r.branch ? ` · ${r.branch}` : ""}
                          </span>
                        </td>
                        {!isFaculty && <td className="px-3 py-3">{r.faculty}</td>}
                        <td className="px-3 py-3 text-right font-medium text-green-700">{r.present}</td>
                        <td className="px-3 py-3 text-right font-medium text-red-700">{r.absent}</td>
                        <td className={`px-3 py-3 text-right font-semibold ${tone(r.percentage)}`}>{r.percentage}%</td>
                      </tr>
                      {open && (
                        <tr className="border-t border-stone-100 bg-stone-50/60">
                          <td />
                          <td colSpan={isFaculty ? 6 : 7} className="px-3 py-3">
                            {!names[key] ? (
                              <p className="text-xs text-slate-500">Loading names...</p>
                            ) : (
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <p className="mb-1 text-xs font-semibold uppercase text-green-700">Present ({names[key].present.length})</p>
                                  <p className="text-sm text-slate-700">{names[key].present.join(", ") || "-"}</p>
                                </div>
                                <div>
                                  <p className="mb-1 text-xs font-semibold uppercase text-red-700">Absent ({names[key].absent.length})</p>
                                  <p className="text-sm text-slate-700">{names[key].absent.join(", ") || "-"}</p>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : !students || students.length === 0 ? (
        <EmptyState message="No attendance has been marked in these dates" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-maroon-50 text-xs uppercase tracking-wide text-maroon-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 text-right font-semibold">Present</th>
                <th className="px-4 py-3 text-right font-semibold">Absent</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-stone-100">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.phoneNumber}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right text-green-700">{s.present}</td>
                  <td className="px-4 py-2.5 text-right text-red-700">{s.absent}</td>
                  <td className="px-4 py-2.5 text-right">{s.total}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${tone(s.percentage)}`}>{s.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceReport;
