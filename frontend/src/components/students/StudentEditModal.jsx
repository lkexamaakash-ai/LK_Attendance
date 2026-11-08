"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Field, ModalShell, api, dateInput, errorText, inputClass } from "./shared";

// Admin: edit a student's details and their current course period.
const StudentEditModal = ({ student, onClose, onSaved }) => {
  const cur = student.currentEnrollment;
  const [form, setForm] = useState({
    name: student.name || "",
    phoneNumber: student.phoneNumber || "",
    address: student.address || "",
    email: student.email || "",
    admissionDate: dateInput(student.admissionDate),
    isActive: student.isActive !== false,
    courseId: cur ? String(cur.courseId) : "",
    batchId: cur ? String(cur.batchId) : "",
    startDate: dateInput(cur?.startDate),
    endDate: dateInput(cur?.endDate),
    totalFee: cur ? String(cur.totalFee) : "",
  });
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("get", "courses")
      .then(({ data }) => setCourses((data.data || []).filter((c) => c.branchId === student.branchId)))
      .catch((e) => toast.error(errorText(e, "Could not load courses")));
  }, [student.branchId]);

  const batches = useMemo(
    () => courses.find((c) => String(c.id) === String(form.courseId))?.batches || [],
    [courses, form.courseId],
  );
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name cannot be empty");
    if (!/^\d{10}$/.test(form.phoneNumber.trim())) return toast.error("Phone number must be 10 digits");
    if (cur && form.endDate < form.startDate) return toast.error("End date cannot be before the start date");

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
      if (cur) {
        await api("put", `students/${student.id}/enrollments/${cur.id}`, {
          batchId: Number(form.batchId),
          startDate: form.startDate,
          endDate: form.endDate,
          totalFee: form.totalFee === "" ? 0 : Number(form.totalFee),
        });
      }
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

          {cur && (
            <>
              <div className="sm:col-span-2 border-t border-stone-100 pt-2">
                <p className="text-sm font-semibold text-maroon-800">Current course period</p>
              </div>
              <Field label="Course">
                <select className={inputClass} value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value, batchId: "" }))}>
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Batch">
                <select className={inputClass} value={form.batchId} onChange={set("batchId")}>
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Course starts">
                <input type="date" className={inputClass} value={form.startDate} onChange={set("startDate")} />
              </Field>
              <Field label="Course ends">
                <input type="date" className={inputClass} value={form.endDate} onChange={set("endDate")} />
              </Field>
              <Field label="Total fee (₹)">
                <input type="number" min="0" className={inputClass} value={form.totalFee} onChange={set("totalFee")} />
              </Field>
            </>
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
