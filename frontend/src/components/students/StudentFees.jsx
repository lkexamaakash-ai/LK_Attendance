"use client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import RecordPaymentModal from "./RecordPaymentModal";
import { PLAN_LABEL, PayBadge, api, errorText, formatDate, modeLabel, money } from "./shared";

const Tile = ({ label, children }) => (
  <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <div className="mt-1 text-xl font-semibold text-slate-900">{children}</div>
  </div>
);

// Fees, installments and payment history for the current course period.
const StudentFees = ({ student, enrollment, isAdmin, onChanged }) => {
  const [showRecord, setShowRecord] = useState(false);
  if (!enrollment) return null;

  const installments = enrollment.installments || [];
  const payments = enrollment.payments || [];

  const remove = async (p) => {
    if (!window.confirm(`Delete the payment of ${money(p.amount)} (${modeLabel(p.mode)})? This is kept in the activity log.`)) return;
    try {
      await api("delete", `students/${student.id}/enrollments/${enrollment.id}/payments/${p.id}`);
      toast.success("Payment deleted");
      onChanged?.();
    } catch (err) {
      toast.error(errorText(err, "Could not delete the payment"));
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Fees &amp; payments</h3>
          <p className="text-xs text-slate-500">
            {enrollment.planType ? PLAN_LABEL[enrollment.planType] : "No payment plan set"}
          </p>
        </div>
        {isAdmin && (
          <Button className="cursor-pointer" disabled={enrollment.balance <= 0} onClick={() => setShowRecord(true)}>
            <Plus className="size-4" /> Record payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Total fee">{money(enrollment.totalFee)}</Tile>
        <Tile label="Paid">
          <span className="text-emerald-700">{money(enrollment.paid)}</span>
        </Tile>
        <Tile label="Balance">
          <span className={enrollment.balance > 0 ? "text-maroon-700" : "text-emerald-700"}>{money(enrollment.balance)}</span>
        </Tile>
        <Tile label="Status">
          <PayBadge status={enrollment.paymentStatus} />
        </Tile>
      </div>

      {enrollment.nextDue && enrollment.balance > 0 && (
        <p className="mt-3 text-sm text-slate-700">
          Next payment due: <span className="font-semibold">{money(enrollment.nextDue.amount)}</span> on{" "}
          <span className="font-semibold">{formatDate(enrollment.nextDue.date)}</span>
        </p>
      )}

      {installments.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">Installments</h4>
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-maroon-50 text-xs uppercase tracking-wide text-maroon-800">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Due date</th>
                  <th className="px-3 py-2 font-semibold">Amount</th>
                  <th className="px-3 py-2 font-semibold">Paid</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((i) => (
                  <tr key={i.id} className="border-t border-stone-100 text-slate-700">
                    <td className="px-3 py-2">{i.number}</td>
                    <td className="px-3 py-2">{formatDate(i.dueDate)}</td>
                    <td className="px-3 py-2">{money(i.amount)}</td>
                    <td className="px-3 py-2">{money(i.paid)}</td>
                    <td className="px-3 py-2"><PayBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold text-slate-900">Payment history</h4>
        {payments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-slate-500">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-maroon-50 text-xs uppercase tracking-wide text-maroon-800">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Amount</th>
                  <th className="px-3 py-2 font-semibold">Paid by</th>
                  <th className="px-3 py-2 font-semibold">For</th>
                  <th className="px-3 py-2 font-semibold">Receipt</th>
                  {isAdmin && <th className="px-3 py-2 font-semibold">Recorded by</th>}
                  {isAdmin && <th className="px-3 py-2" />}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-stone-100 text-slate-700">
                    <td className="px-3 py-2">{formatDate(p.paidOn)}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{money(p.amount)}</td>
                    <td className="px-3 py-2">{modeLabel(p.mode)}</td>
                    <td className="px-3 py-2">{p.installmentNumber ? `Installment ${p.installmentNumber}` : "-"}</td>
                    <td className="px-3 py-2">
                      {p.receiptNo || "-"}
                      {p.note && <span className="block text-xs text-slate-500">{p.note}</span>}
                    </td>
                    {isAdmin && <td className="px-3 py-2 text-xs text-slate-500">{p.recordedBy || "-"}</td>}
                    {isAdmin && (
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => remove(p)}
                          aria-label="Delete payment"
                          className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRecord && (
        <RecordPaymentModal
          student={student}
          enrollment={enrollment}
          onClose={() => setShowRecord(false)}
          onSaved={() => {
            setShowRecord(false);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
};

export default StudentFees;
