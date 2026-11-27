"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import CourseChecklist from "./CourseChecklist";
import { Field, ModalShell, api, errorText, inputClass } from "./shared";

// Gives the same courses to all the selected students.
const AssignCoursesModal = ({ studentIds, onClose, onDone }) => {
  const [branches, setBranches] = useState(null);
  const [courseIds, setCourseIds] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("get", "students/options")
      .then(({ data }) => setBranches(data.data || []))
      .catch((e) => {
        setBranches([]);
        toast.error(errorText(e, "Could not load branches and courses"));
      });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (courseIds.length === 0) return toast.error("Please tick at least one branch and course");
    if (!!startDate !== !!endDate) return toast.error("Please give both dates, or leave both empty");
    if (startDate && endDate < startDate) return toast.error("End date cannot be before the start date");

    try {
      setSaving(true);
      const { data } = await api("post", "students/assign-courses", {
        studentIds,
        courses: courseIds.map((courseId) => ({ courseId, startDate, endDate })),
      });
      toast.success(`Courses added for ${data.data.updated} student${data.data.updated === 1 ? "" : "s"}`);
      onDone?.();
    } catch (err) {
      toast.error(errorText(err, "Could not add the courses"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Assign courses"
      subtitle={`${studentIds.length} student${studentIds.length === 1 ? "" : "s"} selected. Their other courses stay as they are.`}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-slate-700">Branches and courses</p>
            {branches === null ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <CourseChecklist branches={branches} value={courseIds} onChange={setCourseIds} />
            )}
          </div>
          <Field label="Course starts (optional)">
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Course ends (optional)">
            <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <p className="text-xs text-slate-500 sm:col-span-2">
            If a student already has one of these courses, its dates change only when you enter dates here.
          </p>
        </div>
        <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
          <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 cursor-pointer">
            {saving ? "Saving..." : "Assign courses"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default AssignCoursesModal;
