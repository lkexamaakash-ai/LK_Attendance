"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { toast } from "sonner";
import { Field, ModalShell, PAY_MODES, api, errorText, formatDate, inputClass, money, todayInput } from "./shared";

// Admin: record a payment received from a student.
const RecordPaymentModal = ({ student, enrollment, onClose, onSaved }) => {
  const open = (enrollment.installments || []).filter((i) => i.status !== "PAID");
  const first = open[0];
  const [installmentId, setInstallmentId] = useState(first ? String(first.id) : "");
  const [amount, setAmount] = useState(String(first ? first.balance : enrollment.balance));
  const [mode, setMode] = useState("CASH");
  const [paidOn, setPaidOn] = useState(todayInput());
  const [receiptNo, setReceiptNo] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const pick = (id) => {
    setInstallmentId(id);
    const inst = open.find((i) => String(i.id) === id);
    setAmount(String(inst ? inst.balance : enrollment.balance));
  };

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isInteger(n) || n <= 0) return toast.error("Please enter the amount received");
    if (n > enrollment.balance) return toast.error(`Amount is more than the balance of ${money(enrollment.balance)}`);
    try {
      setSaving(true);
      await api("post", `students/${student.id}/enrollments/${enrollment.id}/payments`, {
        amount: n,
        mode,
        paidOn,
        receiptNo,
        note,
        installmentId: installmentId ? Number(installmentId) : undefined,
      });
      toast.success("Payment recorded");
      onSaved?.();
    } catch (err) {
      toast.error(errorText(err, "Could not record the payment"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Record Payment" subtitle={`${student.name} · balance ${money(enrollment.balance)}`} onClose={onClose}>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          {open.length > 0 && (
            <Field label="Payment for" className="sm:col-span-2">
              <select className={inputClass} value={installmentId} onChange={(e) => pick(e.target.value)}>
                {open.map((i) => (
                  <option key={i.id} value={i.id}>
                    Installment {i.number} · due {formatDate(i.dueDate)} · {money(i.balance)} left
                  </option>
                ))}
                <option value="">Other payment (not for an installment)</option>
              </select>
            </Field>
          )}
          <Field label="Amount received (₹)">
            <input type="number" min="1" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Paid by">
            <select className={inputClass} value={mode} onChange={(e) => setMode(e.target.value)}>
              {PAY_MODES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Date received">
            <input type="date" max={todayInput()} className={inputClass} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          </Field>
          <Field label="Receipt number (optional)">
            <input className={inputClass} value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} />
          </Field>
          <Field label="Note (optional)" className="sm:col-span-2">
            <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. cheque number, bank reference" />
          </Field>
        </div>
        <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
          <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 cursor-pointer">
            {saving ? "Saving..." : "Save payment"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

export default RecordPaymentModal;
