"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import CourseChecklist from "./CourseChecklist";
import { Field, ModalShell, api, dateInput, errorText, inputClass } from "./shared";

// Admin: edit a student's details, their branches and courses, and the period of each course.
const StudentEditModal = ({ student, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: student.name || "",
    phoneNumber: student.phoneNumber || "",
    address: student.address || "",
    email: student.email || "",
    admissionDate: dateInput(student.admissionDate),
    isActive: student.isActive !== false,
  });
  const [branches, setBranches] = useState(null);
  const [courseIds, setCourseIds] = useState((student.enrollments || []).map((e) => e.courseId));
  // start / end date of every course, by course id
  const [periods, setPeriods] = useState(() =>
    Object.fromEntries(
      (student.enrollments || []).map((e) => [e.courseId, { startDate: dateInput(e.startDate), endDate: dateInput(e.endDate) }]),
    ),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("get", "students/options")
      .then(({ data }) => setBranches(data.data || []))
      .catch((e) => {
        setBranches([]);
        toast.error(errorText(e, "Could not load branches and courses"));
      });
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const courseName = (id) => {
    for (const b of branches || []) {
      const c = b.courses.find((x) => x.id === id);
      if (c) return `${c.name} · ${b.name}`;
    }
    return `Course ${id}`;
  };

  // a newly ticked course has no dates until you enter them (dates are optional)
  const changeCourses = (ids) => {
    setCourseIds(ids);
    setPeriods((p) => {
      const next = { ...p };
      for (const id of ids) {
        if (!next[id]) next[id] = { startDate: "", endDate: "" };
      }
      return next;
    });
  };

  const setPeriod = (id, key) => (e) =>
    setPeriods((p) => ({ ...p, [id]: { ...p[id], [key]: e.target.value } }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name cannot be empty");
    if (!/^\d{10}$/.test(form.phoneNumber.trim())) return toast.error("Phone number must be 10 digits");
    for (const id of courseIds) {
      const p = periods[id];
      if (!!p?.startDate !== !!p?.endDate) return toast.error(`Please give both dates for ${courseName(id)}, or leave both empty`);
      if (p?.startDate && p.endDate < p.startDate) return toast.error(`End date cannot be before the start date for ${courseName(id)}`);
    }

    try {
      setSaving(true);
      await api("put", `students/${student.id}`, {
        name: form.name,
        phoneNumber: form.phoneNumber.trim(),
        address: form.address,
        email: form.email,
        admissionDate: form.admissionDate || undefined,
        isActive: form.isActive,
      });
      await api("put", `students/${student.id}/enrollments`, {
        courses: courseIds.map((courseId) => ({ courseId, ...periods[courseId] })),
      });
      toast.success("Student updated");
      onSaved?.();
    } catch (err) {
      toast.error(errorText(err, "Could not save changes"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Edit Student" subtitle={student.name} onClose={onClose} wide>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          <Field label="Student name">
            <input className={inputClass} value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Phone number (login)">
            <input className={inputClass} value={form.phoneNumber} onChange={set("phoneNumber")} inputMode="numeric" maxLength={10} />
          </Field>
          <Field label="Admission date">
            <input type="date" className={inputClass} value={form.admissionDate} onChange={set("admissionDate")} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input className={inputClass} value={form.address} onChange={set("address")} />
          </Field>

          <div className="border-t border-stone-100 pt-3 sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-maroon-800">Branches and courses</p>
            {branches === null ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <CourseChecklist branches={branches} value={courseIds} onChange={changeCourses} />
            )}
          </div>

          {courseIds.length > 0 && branches && (
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-medium text-slate-700">Course periods</p>
              {courseIds.map((id) => (
                <div key={id} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_9rem_9rem]">
                  <span className="text-sm font-medium text-slate-800">{courseName(id)}</span>
                  <input type="date" aria-label="Start date" className={inputClass} value={periods[id]?.startDate || ""} onChange={setPeriod(id, "startDate")} />
                  <input type="date" aria-label="End date" className={inputClass} value={periods[id]?.endDate || ""} onChange={setPeriod(id, "endDate")} />
                </div>
              ))}
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="size-4 accent-maroon-700"
            />
            <span className="text-sm text-slate-700">
              Student account is active <span className="text-slate-500">(untick to stop this student from logging in)</span>
            </span>
          </label>
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
          <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 cursor-pointer">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default StudentEditModal;
