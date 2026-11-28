"use client";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Field, ModalShell, api, errorText, getAuth, inputClass } from "./shared";

const HEADERS = [
  "Name",
  "Phone",
  "Courses (optional, comma separated)",
  "Start Date (optional, YYYY-MM-DD)",
  "End Date (optional, YYYY-MM-DD)",
  "Admission Date (optional)",
  "Address (optional)",
  "Email (optional)",
];

const pad = (n) => String(n).padStart(2, "0");

// Accepts an Excel date number, a real date, YYYY-MM-DD or DD/MM/YYYY and returns YYYY-MM-DD.
const toIso = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  if (typeof v === "number") {
    const p = XLSX.SSF.parse_date_code(v);
    return p ? `${p.y}-${pad(p.m)}-${pad(p.d)}` : "";
  }
  if (v instanceof Date) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`; // day first, as used in India
  return s;
};

const norm = (h) => String(h).toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z]/g, "");

const splitCourseNames = (v) =>
  String(v || "")
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);

// edit distance, to suggest the course that is spelled almost the same (for example Defence / Defense)
const distance = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
};

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ["Riya Shah", "9876543210", "UPSC/GPSC Eng, GPSC Gujarati", "2026-11-10", "2027-05-10", "2026-11-10", "Adajan, Surat", ""],
  ]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "student-import-template.xlsx");
};

const StudentImportModal = ({ role, branches = [], onClose, onDone }) => {
  const { user } = getAuth();
  const isSuper = role === "SUPER_ADMIN";
  const [branchId, setBranchId] = useState(isSuper ? "" : String(user?.branchId || ""));
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [options, setOptions] = useState([]); // branches with their courses
  const [choice, setChoice] = useState({}); // sheet course name (lower case) -> course name, or "" for "do not add"

  useEffect(() => {
    api("get", "students/options")
      .then(({ data }) => setOptions(data.data || []))
      .catch(() => {});
  }, []);

  const branchCourses = useMemo(
    () => options.find((b) => String(b.id) === String(branchId))?.courses || [],
    [options, branchId],
  );

  // course names in the sheet that are not a course of the chosen branch
  const unmatched = useMemo(() => {
    if (!branchId || branchCourses.length === 0) return [];
    const known = new Set(branchCourses.map((c) => c.name.trim().toLowerCase()));
    const found = new Map();
    for (const r of rows) {
      for (const n of splitCourseNames(r.courseNames)) {
        const key = n.toLowerCase();
        if (known.has(key)) continue;
        const cur = found.get(key) || { key, label: n, count: 0 };
        cur.count += 1;
        found.set(key, cur);
      }
    }
    return [...found.values()];
  }, [rows, branchId, branchCourses]);

  // a course spelled almost the same is pre-selected, so you only have to confirm it
  const suggested = useMemo(() => {
    const out = {};
    for (const u of unmatched) {
      const best = branchCourses
        .map((c) => ({ name: c.name, d: distance(u.key, c.name.trim().toLowerCase()) }))
        .sort((a, b) => a.d - b.d)[0];
      if (best && best.d <= 2) out[u.key] = best.name;
    }
    return out;
  }, [unmatched, branchCourses]);

  const picked = (key) => (choice[key] !== undefined ? choice[key] : suggested[key]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
      const [head, ...body] = grid;
      const idx = {};
      (head || []).forEach((h, i) => (idx[norm(h)] = i));
      const need = ["name", "phone"]; // everything else is optional
      const missing = need.filter((k) => idx[k] === undefined);
      if (missing.length) {
        toast.error("The Name and Phone columns are needed. Please use the template.");
        return;
      }
      const cell = (r, k) => (idx[k] === undefined ? "" : r[idx[k]]);
      const parsed = body
        .filter((r) => r.some((c) => String(c).trim() !== ""))
        .map((r) => ({
          name: String(cell(r, "name")).trim(),
          phoneNumber: String(cell(r, "phone")).replace(/\D/g, "").slice(-10) || String(cell(r, "phone")).trim(),
          courseNames: String(cell(r, "courses")).trim(),
          startDate: toIso(cell(r, "startdate")),
          endDate: toIso(cell(r, "enddate")),
          admissionDate: toIso(cell(r, "admissiondate")),
          address: String(cell(r, "address")).trim(),
          email: String(cell(r, "email")).trim(),
        }));
      if (!parsed.length) return toast.error("The file has no student rows");
      setRows(parsed);
      setFileName(file.name);
      setResult(null);
    } catch {
      toast.error("Could not read this file. Please use an .xlsx file made from the template.");
    }
  };

  // replaces the course names of the sheet with the courses you matched them to
  const withMatchedCourses = (r) => {
    const names = splitCourseNames(r.courseNames);
    if (!names.length) return r;
    const known = new Set(branchCourses.map((c) => c.name.trim().toLowerCase()));
    const out = [];
    for (const n of names) {
      const key = n.toLowerCase();
      if (known.has(key)) out.push(n);
      else if (picked(key)) out.push(picked(key));
      else if (picked(key) === undefined) out.push(n); // not decided: the server reports it
    }
    return { ...r, courseNames: out.join(", ") };
  };

  const run = async () => {
    if (!branchId) return toast.error("Please choose a branch");
    setBusy(true);
    const created = [];
    const updated = [];
    const errors = [];
    const warnings = [];
    try {
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { data } = await api("post", "students/bulk", {
          branchId: Number(branchId),
          rows: rows.slice(i, i + CHUNK).map(withMatchedCourses),
        });
        created.push(...data.data.created);
        updated.push(...(data.data.updated || []));
        warnings.push(...(data.data.warnings || []).map((w) => ({ ...w, row: w.row + i })));
        // row numbers from the server are relative to this chunk; shift them to the sheet row
        errors.push(...data.data.errors.map((er) => ({ ...er, row: er.row + i })));
      }
      setResult({ created: created.length, updated: updated.length, errors, warnings });
      if (created.length || updated.length) {
        toast.success(`${created.length} added${updated.length ? `, ${updated.length} updated` : ""}`);
        onDone?.();
      }
    } catch (err) {
      toast.error(errorText(err, "Import failed"));
      if (created.length || updated.length) {
        setResult({ created: created.length, updated: updated.length, errors, warnings });
        onDone?.();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Import Students" subtitle="Upload an Excel file to add many students at once." onClose={onClose} wide>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-maroon-100 bg-maroon-50/60 p-4">
          <p className="text-sm text-slate-700">
            Use our template. Only Name and Phone are required. Courses and dates are optional, and if a course name in your file is not in the branch, you can match it to the right course before importing. If a phone number is already added, the courses in that row are added to that student.
          </p>
          <Button type="button" variant="outline" className="cursor-pointer" onClick={downloadTemplate}>
            <Download className="size-4" /> Download template
          </Button>
        </div>

        {isSuper && (
          <Field label="Import into branch">
            <select className={inputClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
        )}

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center transition hover:border-maroon-300 hover:bg-maroon-50/40">
          <FileSpreadsheet className="size-8 text-maroon-400" />
          <span className="text-sm font-medium text-slate-700">
            {fileName ? fileName : "Click to choose an Excel file (.xlsx)"}
          </span>
          {rows.length > 0 && <span className="text-xs text-emerald-700">{rows.length} student row{rows.length === 1 ? "" : "s"} found</span>}
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
        </label>

        {rows.length > 0 && !result && unmatched.length > 0 && (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Some course names in your file are not in this branch. Choose the matching course for each.
            </p>
            {unmatched.map((u) => (
              <div key={u.key} className="rounded-lg border border-amber-200 bg-white p-3">
                <p className="text-sm text-slate-800">
                  <b>{u.label}</b> <span className="text-xs text-slate-500">· {u.count} student{u.count === 1 ? "" : "s"}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {branchCourses.map((c) => {
                    const on = picked(u.key) === c.name;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setChoice((m) => ({ ...m, [u.key]: c.name }))}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                          on ? "border-maroon-700 bg-maroon-50 font-medium text-maroon-800" : "border-stone-300 text-slate-700 hover:border-maroon-300"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setChoice((m) => ({ ...m, [u.key]: "" }))}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                      picked(u.key) === "" ? "border-slate-700 bg-slate-100 font-medium text-slate-800" : "border-stone-300 text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    Don&apos;t add a course
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {rows.length > 0 && !result && (
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-maroon-50 text-maroon-800">
                <tr>
                  {["Name", "Phone", "Courses", "Start", "End"].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="px-3 py-1.5">{r.name}</td>
                    <td className="px-3 py-1.5">{r.phoneNumber}</td>
                    <td className="px-3 py-1.5">{r.courseNames}</td>
                    <td className="px-3 py-1.5">{r.startDate}</td>
                    <td className="px-3 py-1.5">{r.endDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && <p className="border-t border-stone-100 px-3 py-1.5 text-xs text-slate-500">…and {rows.length - 5} more</p>}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-sm font-semibold text-slate-900">
              {result.created} added{result.updated ? `, ${result.updated} updated` : ""}{result.errors.length ? `, ${result.errors.length} skipped` : ""}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-red-700">
                {result.errors.map((er, i) => (
                  <li key={i}>
                    Row {er.row}{er.name ? ` (${er.name})` : ""}: {er.message}
                  </li>
                ))}
              </ul>
            )}
            {result.warnings?.length > 0 && (
              <>
                <p className="mt-3 text-xs font-semibold text-amber-700">
                  Imported, but the course was not added for {result.warnings.length} student{result.warnings.length === 1 ? "" : "s"}
                </p>
                <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs text-amber-700">
                  {result.warnings.map((w, i) => (
                    <li key={i}>
                      Row {w.row}{w.name ? ` (${w.name})` : ""}: {w.message}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
        <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
          {result ? "Close" : "Cancel"}
        </Button>
        {!result && (
          <Button type="button" className="flex-1 cursor-pointer" disabled={busy || rows.length === 0} onClick={run}>
            {busy ? "Importing..." : `Import ${rows.length || ""} students`}
          </Button>
        )}
      </div>
    </ModalShell>
  );
};

export default StudentImportModal;
