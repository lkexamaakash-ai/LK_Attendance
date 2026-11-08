"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { toast } from "sonner";
import { Field, api, errorText, getAuth, inputClass } from "./shared";

// Lets a student change their own password.
const StudentPasswordCard = () => {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!oldPass || !newPass) return toast.error("Please fill in both passwords");
    if (newPass.length < 6) return toast.error("New password must be at least 6 characters");
    try {
      setSaving(true);
      const { user } = getAuth();
      const { data } = await api("put", `auth/changepass/${user.id}`, { oldPass, newPass });
      if (data.success === false) {
        toast.error("Your current password is not correct");
        return;
      }
      toast.success("Password changed");
      setOldPass("");
      setNewPass("");
    } catch (err) {
      toast.error(errorText(err, "Could not change the password"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-stone-200 p-5">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Change password</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current password">
          <input type="password" className={inputClass} value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
        </Field>
        <Field label="New password">
          <input type="password" className={inputClass} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="At least 6 characters" />
        </Field>
      </div>
      <Button type="submit" disabled={saving} className="mt-4 cursor-pointer">
        {saving ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
};

export default StudentPasswordCard;
