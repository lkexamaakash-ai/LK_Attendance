"use client";
import { mainRoute } from "@/components/apiroute";
import AuthShell from "@/components/layout/AuthShell";
import InstallHint from "@/components/layout/InstallHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Briefcase, Building2, Eye, EyeOff, GraduationCap, Loader2, Presentation, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const TYPES = [
  {
    value: "STUDENT",
    label: "Student",
    icon: GraduationCap,
    panel: "Student login: see your course validity and fee details.",
    reset: "Please ask your branch to reset your password.",
  },
  {
    value: "STAFF",
    label: "Staff",
    icon: Briefcase,
    panel: "Staff login: mark your attendance and see your salary details.",
    reset: "Please ask your branch admin to reset your password.",
  },
  {
    value: "FACULTY",
    label: "Faculty",
    icon: Presentation,
    panel: "Faculty login: see your lectures, attendance and salary details.",
    reset: "Please ask your branch admin to reset your password.",
  },
  {
    value: "BRANCH",
    label: "Branch / Admin",
    icon: Building2,
    panel: "Branch and admin login: manage students, staff, faculty, lectures and reports.",
    reset: "Please ask the super admin to reset your password.",
  },
];

const Login = () => {
  const router = useRouter();
  const [loginAs, setLoginAs] = useState("STUDENT");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // pre-select whatever this person used last time
  useEffect(() => {
    try {
      const last = localStorage.getItem("lastLoginType");
      if (TYPES.some((t) => t.value === last)) setLoginAs(last);
    } catch {}
  }, []);

  const current = TYPES.find((t) => t.value === loginAs);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (loading) return;
    setError("");

    const phone = phoneNumber.trim();
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter your 10-digit phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${mainRoute}/api/auth/login`,
        { phoneNumber: phone, password, loginAs },
        { headers: { "Content-Type": "application/json" } },
      );

      localStorage.setItem("user", JSON.stringify(data));
      try {
        localStorage.setItem("lastLoginType", loginAs);
      } catch {}

      if (data?.data?.user?.mustChangePassword) {
        router.push("/set-password");
        toast.success("Please set a new password to continue");
        return;
      }

      router.push("/");
      toast.success("Login Successful");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request ? "Could not reach the server. Please check your internet and try again." : "Login failed. Please try again."),
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Choose your login type, then enter your phone number and password."
      panelText={current.panel}
      footer={
        <p>
          Trouble logging in? Contact{" "}
          <a href="mailto:lkacademysurat@gmail.com" className="font-semibold text-maroon-700 hover:text-maroon-800">
            Admin
          </a>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Login as</legend>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(({ value, label, icon: Icon }) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="loginAs"
                  value={value}
                  checked={loginAs === value}
                  onChange={() => {
                    setLoginAs(value);
                    setError("");
                    setShowReset(false);
                  }}
                  className="peer sr-only"
                />
                <span className="flex items-center gap-2 rounded-lg border border-stone-300 px-2.5 py-2.5 text-[13px] text-slate-700 sm:px-3 sm:text-sm transition peer-checked:border-maroon-700 peer-checked:bg-maroon-50 peer-checked:font-semibold peer-checked:text-maroon-800 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-400 hover:border-maroon-300">
                  <Icon className="size-4 shrink-0" />
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone number
          </label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="username"
            maxLength={10}
            className="h-11"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            placeholder="10-digit phone number"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              className="h-11 pr-11"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter your password"
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
          <button
            type="button"
            onClick={() => setShowReset((v) => !v)}
            className="mt-1.5 cursor-pointer text-xs font-medium text-maroon-700 hover:text-maroon-800"
          >
            Forgot password?
          </button>
          {showReset && (
            <p className="mt-1.5 rounded-lg bg-stone-50 px-3 py-2 text-xs text-slate-600">{current.reset}</p>
          )}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" disabled={loading} className="mt-1 h-11 w-full cursor-pointer text-base">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <InstallHint />
    </AuthShell>
  );
};

export default Login;
