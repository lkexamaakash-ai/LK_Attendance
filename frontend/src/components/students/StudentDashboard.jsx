"use client";
import { BookOpen, Building2, CalendarDays, Layers } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import StatCard from "../layout/StatCard";
import { DaysHero } from "./StudentProfileView";
import { api, errorText, formatDate } from "./shared";

// Home page of a logged-in student.
const StudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("get", "students/me")
      .then(({ data }) => setStudent(data.data))
      .catch((err) => toast.error(errorText(err, "Could not load your details")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="m-6 text-sm text-slate-500">Loading...</p>;
  if (!student) return <p className="m-6 text-sm text-slate-500">We could not find your student profile. Please contact your branch.</p>;

  const cur = student.currentEnrollment;
  return (
    <div className="m-2 h-[91%] space-y-4 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-2xl font-semibold text-maroon-800">Welcome, {student.name} 👋</h2>
        <p className="text-sm text-slate-500">Here is a quick look at your course.</p>
      </div>

      <DaysHero enrollment={cur} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Course" icon={BookOpen}>
          <span className="block whitespace-normal break-words text-lg leading-snug">{cur?.courseName || "-"}</span>
        </StatCard>
        <StatCard label="Batch" icon={Layers} tone="gold">{cur?.batchName || "-"}</StatCard>
        <StatCard label="Branch" icon={Building2} tone="slate">{student.branchName}</StatCard>
        <StatCard label="Valid till" icon={CalendarDays} tone="green">{formatDate(cur?.endDate)}</StatCard>
      </div>
    </div>
  );
};

export default StudentDashboard;
