"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import StudentEditModal from "./StudentEditModal";
import { DaysBadge, api, errorText, formatDate, initialsOf, money } from "./shared";

const DAY = 24 * 60 * 60 * 1000;

// Big "days left" card with a progress bar through the course period.
export const DaysHero = ({ enrollment }) => {
  if (!enrollment) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Course validity</p>
        <p className="mt-2 text-lg text-slate-700">No course has been added yet.</p>
      </div>
    );
  }
  const total = Math.max(1, Math.round((new Date(enrollment.endDate) - new Date(enrollment.startDate)) / DAY));
  const used = Math.min(total, Math.max(0, total - enrollment.daysLeft));
  const pct = Math.round((used / total) * 100);
  const expired = enrollment.status === "EXPIRED";
  const expiring = enrollment.status === "EXPIRING";

  return (
    <div
      className={`rounded-2xl p-6 text-white shadow-md ${
        expired
          ? "bg-gradient-to-br from-red-700 to-red-900"
          : expiring
            ? "bg-gradient-to-br from-amber-600 to-maroon-800"
            : "bg-gradient-to-br from-maroon-700 to-maroon-900"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Course validity</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-5xl font-semibold leading-none">
            {expired ? Math.abs(enrollment.daysLeft) : enrollment.daysLeft}
            <span className="ml-2 text-lg font-normal text-maroon-100">
              {expired ? "days ago" : enrollment.daysLeft === 1 ? "day left" : "days left"}
            </span>
          </p>
          <p className="mt-2 text-sm text-maroon-100">
            {expired ? "This course has ended. Please contact the branch to renew." : expiring ? "The course ends soon." : "The course is active."}
          </p>
        </div>
        <div className="text-right text-sm text-maroon-100">
          <p>{formatDate(enrollment.startDate)}</p>
          <p className="text-xs text-maroon-200">to</p>
          <p>{formatDate(enrollment.endDate)}</p>
        </div>
      </div>
      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-gold-400" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-maroon-200">{pct}% of the course period completed</p>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-0.5 text-sm text-slate-900">{value || "-"}</p>
  </div>
);

// One student's profile. mode "admin" = opened by an admin (with Edit), mode "student" = the student's own page.
const StudentProfileView = ({ mode, studentId, backPath, children }) => {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api("get", mode === "student" ? "students/me" : `students/${studentId}`);
      setStudent(data.data);
    } catch (err) {
      toast.error(errorText(err, "Could not load the profile"));
    } finally {
      setLoading(false);
    }
  }, [mode, studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !student) return <p className="m-6 text-sm text-slate-500">Loading profile...</p>;
  if (!student) return <p className="m-6 text-sm text-slate-500">Profile not found.</p>;

  const cur = student.currentEnrollment;

  return (
    <>
      <div className="m-2 h-[91%] space-y-4 overflow-y-auto rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        {mode === "admin" && (
          <button
            onClick={() => router.push(backPath)}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-maroon-700 hover:text-maroon-800"
          >
            <ArrowLeft className="size-4" /> Back to students
          </button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-maroon-700 text-xl font-semibold text-white ring-4 ring-gold-200">
              {initialsOf(student.name)}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{student.name}</h2>
              <p className="text-sm text-slate-500">
                {student.phoneNumber} · {student.branchName}
                {!student.isActive && (
                  <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Inactive</span>
                )}
              </p>
            </div>
          </div>
          {mode === "admin" && (
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowEdit(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
        </div>

        <DaysHero enrollment={cur} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 p-5">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Current course</h3>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Course" value={cur?.courseName} />
              <Info label="Batch" value={cur?.batchName} />
              <Info label="Starts" value={formatDate(cur?.startDate)} />
              <Info label="Ends" value={formatDate(cur?.endDate)} />
              <Info label="Total fee" value={cur ? money(cur.totalFee) : "-"} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <div className="mt-1"><DaysBadge enrollment={cur} /></div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 p-5">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Student details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Admission date" value={formatDate(student.admissionDate)} />
              <Info label="Branch" value={student.branchName} />
              <Info label="Phone" value={student.phoneNumber} />
              <Info label="Email" value={student.email} />
              <div className="col-span-2"><Info label="Address" value={student.address} /></div>
            </div>
          </div>
        </div>

        {student.enrollments?.length > 1 && (
          <div className="rounded-2xl border border-stone-200 p-5">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Course history</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-maroon-50 text-xs uppercase tracking-wide text-maroon-800">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Course</th>
                    <th className="px-3 py-2 font-semibold">Batch</th>
                    <th className="px-3 py-2 font-semibold">Period</th>
                    <th className="px-3 py-2 font-semibold">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {student.enrollments.map((e) => (
                    <tr key={e.id} className="border-t border-stone-100 text-slate-700">
                      <td className="px-3 py-2">{e.courseName}</td>
                      <td className="px-3 py-2">{e.batchName}</td>
                      <td className="px-3 py-2">{formatDate(e.startDate)} – {formatDate(e.endDate)}</td>
                      <td className="px-3 py-2">{money(e.totalFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {children}
      </div>

      {showEdit && (
        <StudentEditModal
          student={student}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            load();
          }}
        />
      )}
    </>
  );
};

export default StudentProfileView;
