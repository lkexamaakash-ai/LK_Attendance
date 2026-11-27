"use client";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { ModalShell, api, errorText, inputClass } from "./shared";

const BIG = 5; // above this many students the person has to type DELETE

const roleOfUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.data?.user?.role;
  } catch {
    return null;
  }
};

// Asks "are you sure" before deleting many students at once.
const DeleteManyStudentsModal = ({ studentIds, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [typed, setTyped] = useState("");
  const isBranchAdmin = roleOfUser() === "BRANCH_ADMIN";
  const count = studentIds.length;
  const needsTyping = count > BIG;
  const ready = !needsTyping || typed.trim().toUpperCase() === "DELETE";

  const confirm = async () => {
    try {
      setDeleting(true);
      const { data } = await api("post", "students/bulk-delete", { studentIds });
      const r = data.data;
      const parts = [];
      if (r.deleted) parts.push(`${r.deleted} deleted`);
      if (r.removedFromBranch) parts.push(`${r.removedFromBranch} removed from your branch`);
      toast.success(parts.join(", ") || "Done");
      onDeleted?.();
    } catch (err) {
      toast.error(errorText(err, "Could not delete the students"));
      setDeleting(false);
    }
  };

  return (
    <ModalShell title={`Delete ${count} student${count === 1 ? "" : "s"}`} onClose={onClose}>
      <div className="space-y-4 px-6 py-5">
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            This will permanently delete <b>{count} student{count === 1 ? "" : "s"}</b>: their logins, courses and all
            attendance records. This cannot be undone.
          </p>
        </div>
        {isBranchAdmin && (
          <p className="text-sm text-slate-600">
            A student who also studies at another branch is only removed from your branch and stays in the other branch.
          </p>
        )}
        {needsTyping && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Type <b>DELETE</b> to confirm
            </label>
            <input className={inputClass} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" />
          </div>
        )}
      </div>
      <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
        <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={confirm}
          disabled={deleting || !ready}
          className="flex-1 cursor-pointer bg-red-600 text-white hover:bg-red-700"
        >
          {deleting ? "Deleting..." : `Delete ${count}`}
        </Button>
      </div>
    </ModalShell>
  );
};

export default DeleteManyStudentsModal;
