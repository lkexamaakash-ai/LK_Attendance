"use client";
import { ArrowRight, Briefcase, GraduationCap } from "lucide-react";
import React from "react";

const Card = ({ icon: Icon, title, description, cta, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex cursor-pointer flex-col items-start rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-maroon-50/70 p-7 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-maroon-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
  >
    <div className="flex size-14 items-center justify-center rounded-2xl bg-maroon-700 text-gold-300 shadow-md">
      <Icon className="size-7" />
    </div>
    <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-maroon-700 group-hover:text-maroon-800">
      {cta}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </span>
  </button>
);

// Landing page for marking attendance (shared by super admin and branch admin).
const AttendanceHub = ({ onStaff, onFaculty }) => (
  <div className="m-2 h-[91%] overflow-y-auto rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
    <div className="mx-auto max-w-4xl">
      <div className="mb-1 h-1 w-12 rounded bg-gold-400" />
      <h2 className="mt-3 text-2xl font-semibold text-slate-900">Mark Attendance</h2>
      <p className="mt-1 text-sm text-slate-500">
        Choose whose attendance you want to record.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card
          icon={Briefcase}
          title="Staff Attendance"
          description="Record in and out time, late entry and overtime for staff members."
          cta="Mark staff attendance"
          onClick={onStaff}
        />
        <Card
          icon={GraduationCap}
          title="Faculty Attendance"
          description="Record lecture status, penalty and comments for faculty members."
          cta="Mark faculty attendance"
          onClick={onFaculty}
        />
      </div>
    </div>
  </div>
);

export default AttendanceHub;
