"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Field,
  ModalShell,
  PAY_MODES,
  PLAN_LABEL,
  addMonths,
  money,
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

  // optional payment details
  const [showPay, setShowPay] = useState(false);
  const [plan, setPlan] = useState("");
  const [paid, setPaid] = useState({ amount: "", mode: "CASH", date: todayInput(), receiptNo: "", note: "" });
  const [balanceDueDate, setBalanceDueDate] = useState("");
  const [emiCount, setEmiCount] = useState("3");
  const [emiFirst, setEmiFirst] = useState("");
  const [rows, setRows] = useState([]);

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

  const fee = form.totalFee === "" ? 0 : Number(form.totalFee);
  const paidNow = plan === "FULL" ? fee : paid.amount === "" ? 0 : Number(paid.amount);
  const remaining = fee - paidNow;
  const rowsTotal = rows.reduce((t, r) => t + (Number(r.amount) || 0), 0);
  const setPaidField = (key) => (e) => setPaid((p) => ({ ...p, [key]: e.target.value }));

  const createSchedule = () => {
    const n = Number(emiCount);
    if (!Number.isInteger(n) || n < 1 || n > 36) return toast.error("Number of installments must be between 1 and 36");
    if (remaining <= 0) return toast.error("Enter the total fee (and a smaller amount paid now) first");
    const first = emiFirst || addMonths(form.startDate, 1);
    if (!first) return toast.error("Choose the first due date");
    setEmiFirst(first);
    const base = Math.floor(remaining / n);
    setRows(
      Array.from({ length: n }, (_, i) => ({
        dueDate: addMonths(first, i),
        amount: String(i === n - 1 ? remaining - base * (n - 1) : base),
      })),
    );
  };

  const buildPayment = () => {
    if (!plan) return undefined;
    if (fee <= 0) throw new Error("Enter the total fee before adding payment details");
    const payment = { planType: plan };
    if (paidNow > 0) {
      payment.paidNow = { amount: paidNow, mode: paid.mode, date: paid.date, receiptNo: paid.receiptNo, note: paid.note };
    }
    if (plan === "FULL") return payment;
    if (plan === "DOWN_PAYMENT") {
      if (!(paidNow > 0 && paidNow < fee)) throw new Error("For a down payment, enter an amount above 0 and below the total fee");
      payment.balanceDueDate = balanceDueDate || undefined;
      return payment;
    }
    if (rows.length === 0) throw new Error("Please create the installment schedule");
    if (rowsTotal !== remaining) throw new Error(`Installments add up to ${money(rowsTotal)} but ${money(remaining)} is left to pay`);
    payment.installments = rows.map((r) => ({ dueDate: r.dueDate, amount: Number(r.amount) }));
    return payment;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Please enter the student's name");
    if (!/^\d{10}$/.test(form.phoneNumber.trim())) return toast.error("Phone number must be 10 digits");
    if (!form.branchId) return toast.error("Please choose a branch");
    if (!form.batchId) return toast.error("Please choose a course and batch");
    if (!form.startDate || !form.endDate) return toast.error("Please enter the course start and end dates");
    if (form.endDate < form.startDate) return toast.error("End date cannot be before the start date");

    let payment;
    try {
      payment = buildPayment();
    } catch (err) {
      return toast.error(err.message);
    }

    try {
      setSaving(true);
      const { data } = await api("post", "students", {
        payment,
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

          <div className="sm:col-span-2 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setShowPay((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-semibold text-maroon-800">Payment details <span className="font-normal text-slate-500">(optional)</span></span>
                <span className="block text-xs text-slate-500">Cash, down payment or EMI. You can also add payments later from the profile.</span>
              </span>
              <span className="text-lg text-maroon-700">{showPay ? "−" : "+"}</span>
            </button>

            {showPay && (
              <div className="grid grid-cols-1 gap-4 border-t border-stone-100 px-4 py-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Payment plan</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[["", "Not now"], ["FULL", PLAN_LABEL.FULL], ["DOWN_PAYMENT", PLAN_LABEL.DOWN_PAYMENT], ["EMI", PLAN_LABEL.EMI]].map(([v, l]) => (
                      <button
                        type="button"
                        key={v || "none"}
                        onClick={() => {
                          setPlan(v);
                          setRows([]);
                        }}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition ${
                          plan === v
                            ? "border-maroon-700 bg-maroon-50 font-semibold text-maroon-800"
                            : "border-stone-300 text-slate-700 hover:border-maroon-300"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {plan && (
                  <>
                    {plan === "FULL" ? (
                      <div className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-slate-700 sm:col-span-2">
                        Amount paid: <span className="font-semibold">{money(fee)}</span> (the full fee)
                      </div>
                    ) : (
                      <Field label={plan === "EMI" ? "Amount paid now (₹, can be 0)" : "Down payment (₹)"}>
                        <input type="number" min="0" className={inputClass} value={paid.amount} onChange={setPaidField("amount")} />
                      </Field>
                    )}
                    {paidNow > 0 && (
                      <>
                        <Field label="Paid by">
                          <select className={inputClass} value={paid.mode} onChange={setPaidField("mode")}>
                            {PAY_MODES.map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Date received">
                          <input type="date" max={todayInput()} className={inputClass} value={paid.date} onChange={setPaidField("date")} />
                        </Field>
                        <Field label="Receipt number (optional)">
                          <input className={inputClass} value={paid.receiptNo} onChange={setPaidField("receiptNo")} />
                        </Field>
                        <Field label="Note (optional)" className="sm:col-span-2">
                          <input className={inputClass} value={paid.note} onChange={setPaidField("note")} />
                        </Field>
                      </>
                    )}

                    {plan === "DOWN_PAYMENT" && (
                      <Field label="Balance due by (optional)">
                        <input type="date" className={inputClass} value={balanceDueDate} onChange={(e) => setBalanceDueDate(e.target.value)} />
                        <span className="text-xs text-slate-500">Balance after down payment: {money(Math.max(0, remaining))}</span>
                      </Field>
                    )}

                    {plan === "EMI" && (
                      <div className="space-y-3 sm:col-span-2">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="Number of installments">
                            <input type="number" min="1" max="36" className={inputClass} value={emiCount} onChange={(e) => setEmiCount(e.target.value)} />
                          </Field>
                          <Field label="First due date">
                            <input type="date" className={inputClass} value={emiFirst} onChange={(e) => setEmiFirst(e.target.value)} />
                          </Field>
                          <div className="flex items-end">
                            <Button type="button" variant="outline" className="w-full cursor-pointer" onClick={createSchedule}>
                              Create schedule
                            </Button>
                          </div>
                        </div>
                        {rows.length > 0 && (
                          <div className="rounded-lg border border-stone-200">
                            {rows.map((r, i) => (
                              <div key={i} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 border-b border-stone-100 px-3 py-2 last:border-b-0">
                                <span className="text-xs font-semibold text-slate-500">{i + 1}</span>
                                <input
                                  type="date"
                                  className={inputClass}
                                  value={r.dueDate}
                                  onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, dueDate: e.target.value } : x)))}
                                />
                                <input
                                  type="number"
                                  min="1"
                                  className={inputClass}
                                  value={r.amount}
                                  onChange={(e) => setRows((all) => all.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
                                />
                              </div>
                            ))}
                            <p className={`px-3 py-2 text-xs ${rowsTotal === remaining ? "text-emerald-700" : "text-red-600"}`}>
                              Installments total {money(rowsTotal)} · to be paid in installments {money(Math.max(0, remaining))}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
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
