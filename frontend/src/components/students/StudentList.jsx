"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, Trash2, Upload, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import EmptyState from "../layout/EmptyState";
import DeleteManyStudentsModal from "./DeleteManyStudentsModal";
import StudentFormModal from "./StudentFormModal";
import StudentImportModal from "./StudentImportModal";
import { DaysBadge, api, errorText, initialsOf } from "./shared";

const PAGE_SIZE = 20;

// List of students for super admin and branch admin.
const StudentList = ({ role, basePath }) => {
  const router = useRouter();
  const isSuper = role === "SUPER_ADMIN";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [showDelete, setShowDelete] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);

  useEffect(() => {
    if (!isSuper) return;
    api("get", "branch")
      .then(({ data }) => setBranches(data.data || []))
      .catch(() => {});
  }, [isSuper]);

  // wait a moment after typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api("get", "students", null, {
        page,
        pageSize: PAGE_SIZE,
        q: q || undefined,
        branchId: branchId || undefined,
      });
      setItems(data.data.items);
      setTotal(data.data.total);
    } catch (err) {
      toast.error(errorText(err, "Could not load students"));
    } finally {
      setLoading(false);
    }
  }, [page, q, branchId]);

  useEffect(() => {
    load();
  }, [load]);

  const pageIds = items.map((s) => s.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPage) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  // select every student that matches the current search / branch, across all pages
  const selectEverything = async () => {
    try {
      setSelectingAll(true);
      const { data } = await api("get", "students/ids", null, { q: q || undefined, branchId: branchId || undefined });
      setSelected(new Set(data.data));
    } catch (err) {
      toast.error(errorText(err, "Could not select all students"));
    } finally {
      setSelectingAll(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <div className="m-2 flex h-[91%] flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search by name or phone number"
              className="h-10 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-300/50"
            />
          </div>
          {isSuper && (
            <select
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-gold-500"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <Button variant="outline" className="cursor-pointer" onClick={() => setShowImport(true)}>
            <Upload className="size-4" /> Import Excel
          </Button>
          <Button className="cursor-pointer" onClick={() => setShowAdd(true)}>
            <UserPlus className="size-4" /> Add Student
          </Button>
        </div>

        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-maroon-200 bg-maroon-50 px-4 py-2.5 text-sm">
            <span className="font-medium text-maroon-800">{selected.size} selected</span>
            {selected.size < total && (
              <button
                onClick={selectEverything}
                disabled={selectingAll}
                className="cursor-pointer font-medium text-maroon-700 underline hover:text-maroon-800"
              >
                {selectingAll ? "Selecting..." : `Select all ${total}`}
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="sticky top-0 bg-maroon-50 text-xs uppercase tracking-wide text-maroon-800">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all students on this page"
                    checked={allOnPage}
                    onChange={togglePage}
                    className="size-4 cursor-pointer accent-maroon-700"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Student</th>
                {isSuper && <th className="px-4 py-3 font-semibold">Branch</th>}
                <th className="px-4 py-3 font-semibold">Courses &amp; validity</th>
                <th className="px-4 py-3 text-right font-semibold">Profile</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => router.push(`${basePath}/${s.id}`)}
                  className="cursor-pointer border-t border-stone-100 text-slate-700 transition-colors hover:bg-maroon-50/70"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.name}`}
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="size-4 cursor-pointer accent-maroon-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-xs font-semibold text-maroon-700">
                        {initialsOf(s.name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {s.name}
                          {!s.isActive && (
                            <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Inactive</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{s.phoneNumber}</p>
                      </div>
                    </div>
                  </td>
                  {isSuper && <td className="px-4 py-3">{s.branchName}</td>}
                  <td className="px-4 py-3">
                    {s.enrollments.length ? (
                      <ul className="space-y-1.5">
                        {s.enrollments.map((e) => (
                          <li key={e.id} className="flex flex-wrap items-center gap-2">
                            <span>
                              {e.courseName}
                              {isSuper && <span className="text-xs text-slate-500"> · {e.branchName}</span>}
                            </span>
                            <DaysBadge enrollment={e} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-maroon-700">View →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <EmptyState message={q ? "No students match your search" : "No students yet"} />
          )}
          {loading && items.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Loading students...</p>}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            {total === 0 ? "No students" : `Showing ${from}–${to} of ${total}`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <span className="px-1">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {showAdd && (
        <StudentFormModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
      {showImport && (
        <StudentImportModal role={role} branches={branches} onClose={() => setShowImport(false)} onDone={load} />
      )}
      {showDelete && (
        <DeleteManyStudentsModal
          studentIds={[...selected]}
          onClose={() => setShowDelete(false)}
          onDeleted={() => {
            setShowDelete(false);
            setSelected(new Set());
            setPage(1);
            load();
          }}
        />
      )}
    </>
  );
};

export default StudentList;
