"use client";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { ModalShell, api, errorText } from "./shared";

const roleOfUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.data?.user?.role;
  } catch {
    return null;
  }
};

// Asks "are you sure" before deleting a student.
const DeleteStudentModal = ({ student, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const isBranchAdmin = roleOfUser() === "BRANCH_ADMIN";

  const confirm = async () => {
    try {
      setDeleting(true);
      const { data } = await api("delete", `students/${student.id}`);
      toast.success(
        data.data?.removedFromBranch
          ? `${student.name} was removed from your branch`
          : `${student.name} was deleted`,
      );
      onDeleted?.();
    } catch (err) {
      toast.error(errorText(err, "Could not delete the student"));
      setDeleting(false);
    }
  };

  return (
    <ModalShell title="Delete student" subtitle={student.name} onClose={onClose}>
      <div className="space-y-4 px-6 py-5">
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            This will permanently delete <b>{student.name}</b>: the login, the courses and all attendance records. This
            cannot be undone.
          </p>
        </div>
        {isBranchAdmin && (
          <p className="text-sm text-slate-600">
            If this student also studies at another branch, they will only be removed from your branch and stay in the
            other branch.
          </p>
        )}
      </div>
      <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
        <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={confirm}
          disabled={deleting}
          className="flex-1 cursor-pointer bg-red-600 text-white hover:bg-red-700"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </Button>
      </div>
    </ModalShell>
  );
};

export default DeleteStudentModal;
