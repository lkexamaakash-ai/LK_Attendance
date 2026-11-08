"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Field,
  ModalShell,
  addMonths,
  api,
  errorText,
  getAuth,
  inputClass,
  todayInput,
} from "./shared";

const empty = () => ({
  name: "",
  phoneNumber: "",
  branchId: "",
  courseId: "",
  batchId: "",
  admissionDate: todayInput(),
  startDate: todayInput(),
  endDate: "",
  totalFee: "",
  address: "",
  email: "",
});

// Add a new student with their first course period.
const StudentFormModal = ({ role, branches = [], onClose, onSaved }) => {
  const { user } = getAuth();
  const isSuper = role === "SUPER_ADMIN";
  const [form, setForm] = useState({ ...empty(), branchId: isSuper ? "" : String(user?.branchId || "") });
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("get", "courses")
      .then(({ data }) => setCourses(data.data || []))
      .catch((e) => toast.error(errorText(e, "Could not load courses")));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const branchCourses = useMemo(
    () => courses.filter((c) => String(c.branchId) === String(form.branchId)),
    [courses, form.branchId],
  );
  const batches = useMemo(
    () => branchCourses.find((c) => String(c.id) === String(form.courseId))?.batches || [],
    [branchCourses, form.courseId],
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter the student's name");
    if (!/^\d{10}$/.test(form.phoneNumber.trim())) return toast.error("Phone number must be 10 digits");
    if (!form.branchId) return toast.error("Please choose a branch");
    if (!form.batchId) return toast.error("Please choose a course and batch");
    if (!form.startDate || !form.endDate) return toast.error("Please enter the course start and end dates");
    if (form.endDate < form.startDate) return toast.error("End date cannot be before the start date");

    try {
      setSaving(true);
      const { data } = await api("post", "students", {
        name: form.name,
        phoneNumber: form.phoneNumber.trim(),
        branchId: Number(form.branchId),
        batchId: Number(form.batchId),
        admissionDate: form.admissionDate,
        startDate: form.startDate,
        endDate: form.endDate,
        totalFee: form.totalFee === "" ? 0 : Number(form.totalFee),
        address: form.address,
        email: form.email,
      });
      toast.success("Student added. They can log in with the default password.");
      onSaved?.(data.data);
    } catch (err) {
      toast.error(errorText(err, "Could not add the student"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Add Student" subtitle="Creates the student's login and their first course period." onClose={onClose} wide>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          <Field label="Student name">
            <input className={inputClass} value={form.name} onChange={set("name")} placeholder="Full name" />
          </Field>
          <Field label="Phone number (login)">
            <input className={inputClass} value={form.phoneNumber} onChange={set("phoneNumber")} inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" />
          </Field>

          {isSuper && (
            <Field label="Branch" className="sm:col-span-2">
              <select
                className={inputClass}
                value={form.branchId}
                onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value, courseId: "", batchId: "" }))}
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Course">
            <select
              className={inputClass}
              value={form.courseId}
              disabled={!form.branchId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value, batchId: "" }))}
            >
              <option value="">{form.branchId ? "Select course" : "Choose a branch first"}</option>
              {branchCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Batch">
            <select className={inputClass} value={form.batchId} disabled={!form.courseId} onChange={set("batchId")}>
              <option value="">{form.courseId ? "Select batch" : "Choose a course first"}</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Admission date">
            <input type="date" className={inputClass} value={form.admissionDate} onChange={set("admissionDate")} />
          </Field>
          <Field label="Total fee (₹)">
            <input type="number" min="0" className={inputClass} value={form.totalFee} onChange={set("totalFee")} placeholder="0" />
          </Field>

          <Field label="Course starts">
            <input type="date" className={inputClass} value={form.startDate} onChange={set("startDate")} />
          </Field>
          <Field label="Course ends">
            <input type="date" className={inputClass} value={form.endDate} onChange={set("endDate")} />
            <div className="flex gap-2 pt-1">
              {[
                ["3 months", 3],
                ["6 months", 6],
                ["1 year", 12],
              ].map(([label, m]) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setForm((f) => ({ ...f, endDate: addMonths(f.startDate, m) }))}
                  className="cursor-pointer rounded-full bg-maroon-50 px-3 py-1 text-xs font-medium text-maroon-700 hover:bg-maroon-100"
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Address (optional)" className="sm:col-span-2">
            <input className={inputClass} value={form.address} onChange={set("address")} />
          </Field>
          <Field label="Email (optional)" className="sm:col-span-2">
            <input type="email" className={inputClass} value={form.email} onChange={set("email")} />
          </Field>
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
          <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 cursor-pointer">
            {saving ? "Saving..." : "Add student"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default StudentFormModal;
