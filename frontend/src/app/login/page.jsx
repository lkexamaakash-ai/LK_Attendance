"use client";
import { mainRoute } from "@/components/apiroute";
import AuthShell from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const router = useRouter();

  const handleLogin = async (e) => {
    e?.preventDefault();
    try {
      const { data } = await axios.post(
        `${mainRoute}/api/auth/login`,
        { phoneNumber, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      localStorage.setItem("user", JSON.stringify(data));

      if (data?.data?.user?.mustChangePassword) {
        router.push("/set-password");
        toast.success("Please set a new password to continue");
        return;
      }

      router.push("/");
      toast.success("Login Successful");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with your phone number to continue."
      footer={
        <div className="space-y-2">
          <p>
            Trouble logging in? Contact{" "}
            <a
              href="mailto:lkacademysurat@gmail.com"
              className="font-semibold text-maroon-700 hover:text-maroon-800"
            >
              Admin
            </a>
          </p>
          <p>
            <span
              onClick={() => router.push("/register")}
              className="cursor-pointer font-semibold text-maroon-700 hover:text-maroon-800"
            >
              Register as Super Admin
            </span>
          </p>
        </div>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone number
          </label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={10}
            className="h-11"
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              className="h-11 pr-11"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
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

        <Button type="submit" className="mt-2 h-11 w-full cursor-pointer text-base">
          Log in
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
