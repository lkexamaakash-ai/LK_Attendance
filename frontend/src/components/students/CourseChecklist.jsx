"use client";
import React, { useState } from "react";

// Checkboxes: first the branches a student goes to, then, under each ticked branch, the courses of that branch.
// branches: [{ id, name, courses: [{ id, name }] }]   value: array of selected course ids
const CourseChecklist = ({ branches = [], value = [], onChange }) => {
  const [open, setOpen] = useState(() => {
    const opened = new Set(branches.filter((b) => b.courses.some((c) => value.includes(c.id))).map((b) => b.id));
    if (branches.length === 1) opened.add(branches[0].id); // a branch admin has only their own branch
    return opened;
  });

  const toggleBranch = (branch) => {
    const next = new Set(open);
    if (next.has(branch.id)) {
      next.delete(branch.id);
      // unticking a branch also unticks its courses
      onChange(value.filter((id) => !branch.courses.some((c) => c.id === id)));
    } else {
      next.add(branch.id);
    }
    setOpen(next);
  };

  const toggleCourse = (id) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  if (branches.length === 0) return <p className="text-sm text-slate-500">No branches or courses found.</p>;

  return (
    <div className="space-y-3">
      {branches.map((b) => {
        const isOpen = open.has(b.id);
        return (
          <div
            key={b.id}
            className={`rounded-xl border p-3 transition ${isOpen ? "border-maroon-300 bg-maroon-50/40" : "border-stone-200"}`}
          >
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={() => toggleBranch(b)}
                className="size-4 accent-maroon-700"
              />
              <span className="text-sm font-semibold text-maroon-800">{b.name}</span>
            </label>

            {isOpen && (
              <div className="mt-3 flex flex-wrap gap-2 pl-7">
                {b.courses.length === 0 && <span className="text-xs text-slate-500">No courses in this branch yet</span>}
                {b.courses.map((c) => {
                  const on = value.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        on
                          ? "border-maroon-700 bg-white font-medium text-maroon-800"
                          : "border-stone-300 bg-white text-slate-700 hover:border-maroon-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleCourse(c.id)}
                        className="size-4 accent-maroon-700"
                      />
                      {c.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseChecklist;
