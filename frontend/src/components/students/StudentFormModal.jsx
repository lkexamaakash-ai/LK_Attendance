"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import CourseChecklist from "./CourseChecklist";
import { Field, ModalShell, addMonths, api, errorText, inputClass, todayInput } from "./shared";

// Add a new student: details, which branches and courses they go to, and the course period.
const StudentFormModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    admissionDate: todayInput(),
    startDate: todayInput(),
    endDate: "",
    address: "",
    email: "",
  });
  const [branches, setBranches] = useState(null);
  const [courseIds, setCourseIds] = useState([]);
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

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter the student's name");
    if (!/^\d{10}$/.test(form.phoneNumber.trim())) return toast.error("Phone number must be 10 digits");
    if (courseIds.length === 0) return toast.error("Please tick at least one branch and course");
    if (!!form.startDate !== !!form.endDate) return toast.error("Please give both course dates, or leave both empty");
    if (form.startDate && form.endDate < form.startDate) return toast.error("End date cannot be before the start date");

    try {
      setSaving(true);
      const { data } = await api("post", "students", {
        name: form.name,
        phoneNumber: form.phoneNumber.trim(),
        admissionDate: form.admissionDate,
        address: form.address,
        email: form.email,
        courses: courseIds.map((courseId) => ({ courseId, startDate: form.startDate, endDate: form.endDate })),
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
    <ModalShell title="Add Student" subtitle="Creates the student's login and enrols them in courses." onClose={onClose} wide>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          <Field label="Student name">
            <input className={inputClass} value={form.name} onChange={set("name")} placeholder="Full name" />
          </Field>
          <Field label="Phone number (login)">
            <input className={inputClass} value={form.phoneNumber} onChange={set("phoneNumber")} inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" />
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">Branches and courses</p>
            {branches === null ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <CourseChecklist branches={branches} value={courseIds} onChange={setCourseIds} />
            )}
          </div>

          <Field label="Admission date">
            <input type="date" className={inputClass} value={form.admissionDate} onChange={set("admissionDate")} />
          </Field>
          <div />

          <Field label="Course starts (optional)">
            <input type="date" className={inputClass} value={form.startDate} onChange={set("startDate")} />
          </Field>
          <Field label="Course ends (optional)">
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
