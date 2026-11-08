"use client";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Field, ModalShell, api, errorText, getAuth, inputClass } from "./shared";

const HEADERS = [
  "Name",
  "Phone",
  "Course",
  "Batch",
  "Start Date (YYYY-MM-DD)",
  "End Date (YYYY-MM-DD)",
  "Total Fee",
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

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ["Riya Shah", "9876543210", "UPSC/GPSC Eng", "Morning", "2026-11-10", "2027-05-10", 25000, "2026-11-10", "Adajan, Surat", ""],
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
      const need = ["name", "phone", "course", "batch", "startdate", "enddate"];
      const missing = need.filter((k) => idx[k] === undefined);
      if (missing.length) {
        toast.error("Some columns are missing. Please use the template.");
        return;
      }
      const cell = (r, k) => (idx[k] === undefined ? "" : r[idx[k]]);
      const parsed = body
        .filter((r) => r.some((c) => String(c).trim() !== ""))
        .map((r) => ({
          name: String(cell(r, "name")).trim(),
          phoneNumber: String(cell(r, "phone")).replace(/\D/g, "").slice(-10) || String(cell(r, "phone")).trim(),
          courseName: String(cell(r, "course")).trim(),
          batchName: String(cell(r, "batch")).trim(),
          startDate: toIso(cell(r, "startdate")),
          endDate: toIso(cell(r, "enddate")),
          totalFee: cell(r, "totalfee") === "" ? 0 : Number(cell(r, "totalfee")),
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

  const run = async () => {
    if (!branchId) return toast.error("Please choose a branch");
    setBusy(true);
    const created = [];
    const errors = [];
    try {
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { data } = await api("post", "students/bulk", {
          branchId: Number(branchId),
          rows: rows.slice(i, i + CHUNK),
        });
        created.push(...data.data.created);
        // row numbers from the server are relative to this chunk; shift them to the sheet row
        errors.push(...data.data.errors.map((er) => ({ ...er, row: er.row + i })));
      }
      setResult({ created: created.length, errors });
      if (created.length) {
        toast.success(`${created.length} student${created.length === 1 ? "" : "s"} imported`);
        onDone?.();
      }
    } catch (err) {
      toast.error(errorText(err, "Import failed"));
      if (created.length) {
        setResult({ created: created.length, errors });
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
            Use our template. Course and batch names must match exactly what is already created for the branch.
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

        {rows.length > 0 && !result && (
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-maroon-50 text-maroon-800">
                <tr>
                  {["Name", "Phone", "Course", "Batch", "Start", "End"].map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="px-3 py-1.5">{r.name}</td>
                    <td className="px-3 py-1.5">{r.phoneNumber}</td>
                    <td className="px-3 py-1.5">{r.courseName}</td>
                    <td className="px-3 py-1.5">{r.batchName}</td>
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
              {result.created} imported{result.errors.length ? `, ${result.errors.length} skipped` : ""}
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
