"use client";
import { mainRoute } from "@/components/apiroute";
import AuthShell from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const SetPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user"));
    if (!stored) {
      router.replace("/login");
    } else if (!stored.data?.user?.mustChangePassword) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const stored = JSON.parse(localStorage.getItem("user"));

      const { data } = await axios.put(
        `${mainRoute}/api/auth/first-login-password`,
        { newPassword },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${stored.data.token}`,
          },
        },
      );

      // keep the same shape the rest of the app expects (stored.data.token / stored.data.user)
      stored.data = { ...stored.data, ...data.data };
      localStorage.setItem("user", JSON.stringify(stored));

      toast.success("Password set successfully");
      router.push("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set your password"
      subtitle="You are using the default password. Choose a new one to continue."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            New password
          </label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              className="h-11 pr-11"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-maroon-700"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Confirm new password
          </label>
          <Input
            type={showPass ? "text" : "password"}
            className="h-11"
            placeholder="Re-enter the new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 w-full cursor-pointer text-base"
        >
          {loading ? "Saving..." : "Set password"}
        </Button>
      </form>
    </AuthShell>
  );
};

export default SetPassword;
