"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import EmptyState from "../layout/EmptyState";
import { api, errorText, initialsOf } from "./shared";

const todayISO = () => {
  // today's date in India
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

const timeOf = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" })
    : "";

// Marks student attendance, batch by batch and lecture by lecture.
// Used by super admin, branch admin and faculty.
const StudentAttendanceMarker = ({ role }) => {
  const isFaculty = role === "FACULTY";
  const isSuper = role === "SUPER_ADMIN";

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  const [lecture, setLecture] = useState(null); // the lecture being marked
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // studentId -> PRESENT | ABSENT
  const [sheetLoading, setSheetLoading] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSuper) return;
    api("get", "branch")
      .then(({ data }) => setBranches(data.data || []))
      .catch(() => {});
  }, [isSuper]);

  const loadLectures = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api("get", "studentAttendance/lectures", null, {
        date,
        branchId: branchId || undefined,
      });
      setLectures(data.data || []);
    } catch (err) {
      toast.error(errorText(err, "Could not load lectures"));
    } finally {
      setLoading(false);
    }
  }, [date, branchId]);

  useEffect(() => {
    if (!lecture) loadLectures();
  }, [loadLectures, lecture]);

  // group the day's lectures by batch
  const byBatch = useMemo(() => {
    const groups = new Map();
    for (const l of lectures) {
      const key = l.batch.id;
      if (!groups.has(key)) groups.set(key, { batch: l.batch, course: l.course, branch: l.branch, items: [] });
      groups.get(key).items.push(l);
    }
    return [...groups.values()];
  }, [lectures]);

  const openLecture = async (l) => {
    try {
      setSheetLoading(true);
      setLecture(l);
      const { data } = await api("get", "studentAttendance/sheet", null, { lectureId: l.id, date });
      const sheet = data.data;
      setStudents(sheet.students);
      setAlreadyMarked(sheet.alreadyMarked);
      // new sheet: everyone present by default; saved sheet: show what was saved
      const initial = {};
      for (const s of sheet.students) initial[s.id] = s.status || "PRESENT";
      setMarks(initial);
    } catch (err) {
      toast.error(errorText(err, "Could not load students"));
      setLecture(null);
    } finally {
      setSheetLoading(false);
    }
  };

  const toggle = (id) => setMarks((m) => ({ ...m, [id]: m[id] === "PRESENT" ? "ABSENT" : "PRESENT" }));
  const setAll = (status) => setMarks(Object.fromEntries(students.map((s) => [s.id, status])));

  const presentCount = students.filter((s) => marks[s.id] === "PRESENT").length;

  const save = async () => {
    try {
      setSaving(true);
      await api("post", "studentAttendance", {
        lectureId: lecture.id,
        date,
        records: students.map((s) => ({ studentId: s.id, status: marks[s.id] })),
      });
      toast.success("Attendance saved");
      setLecture(null);
    } catch (err) {
      toast.error(errorText(err, "Could not save attendance"));
    } finally {
      setSaving(false);
    }
  };

  // ---------- sheet view ----------
  if (lecture) {
    return (
      <div className="m-2 h-[91%] space-y-4 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <button
          onClick={() => setLecture(null)}
          className="flex items-center gap-1 text-sm font-medium text-maroon-700 hover:underline"
        >
          <ArrowLeft className="size-4" /> Back to lectures
        </button>

        <div>
          <h2 className="text-xl font-semibold text-maroon-800">{lecture.batch.name}</h2>
          <p className="text-sm text-slate-500">
            {lecture.subject?.name} · {timeOf(lecture.startTime)} - {timeOf(lecture.endTime)} · {date}
            {alreadyMarked && " · already marked (editing)"}
          </p>
        </div>

        {sheetLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : students.length === 0 ? (
          <EmptyState message="No students are enrolled in this batch" />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600">
                Present {presentCount} / {students.length}
              </span>
              <Button variant="outline" size="sm" onClick={() => setAll("PRESENT")}>
                All present
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAll("ABSENT")}>
                All absent
              </Button>
            </div>

            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
              {students.map((s) => {
                const present = marks[s.id] === "PRESENT";
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-maroon-50 text-sm font-semibold text-maroon-700">
                        {initialsOf(s.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.phoneNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(s.id)}
                      className={`flex w-28 shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                        present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {present ? <Check className="size-4" /> : <X className="size-4" />}
                      {present ? "Present" : "Absent"}
                    </button>
                  </li>
                );
              })}
            </ul>

            <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
              {saving ? "Saving..." : alreadyMarked ? "Update attendance" : "Save attendance"}
            </Button>
          </>
        )}
      </div>
    );
  }

  // ---------- lecture list view ----------
  return (
    <div className="m-2 h-[91%] space-y-4 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-600">
          Date
          <input
            type="date"
            value={date}
            max={todayISO()}
            min={isFaculty ? todayISO() : undefined}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        {isSuper && (
          <label className="text-sm text-slate-600">
            Branch
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm"
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
      </div>
      {isFaculty && <p className="text-xs text-slate-500">Faculty can mark today only. Past dates are edited by the branch admin.</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : byBatch.length === 0 ? (
        <EmptyState message="No lectures on this date" />
      ) : (
        byBatch.map((g) => (
          <div key={g.batch.id} className="rounded-lg border border-stone-200">
            <div className="border-b border-stone-200 bg-stone-50 px-4 py-2">
              <p className="font-semibold text-maroon-800">{g.batch.name}</p>
              <p className="text-xs text-slate-500">
                {g.course.name}
                {isSuper && g.branch ? ` · ${g.branch.name}` : ""}
              </p>
            </div>
            <ul className="divide-y divide-stone-100">
              {g.items.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="font-medium text-slate-800">{l.subject?.name}</p>
                    <p className="text-xs text-slate-500">
                      {timeOf(l.startTime)} - {timeOf(l.endTime)} · {l.faculty?.name} · {l.studentCount} students
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.markedCount > 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Marked</span>
                    )}
                    <Button size="sm" onClick={() => openLecture(l)}>
                      {l.markedCount > 0 ? "Edit" : "Mark"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default StudentAttendanceMarker;
