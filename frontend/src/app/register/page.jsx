"use client";
import AuthShell from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { mainRoute } from "@/components/apiroute";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPass, setShowPass] = useState(false);

  const router = useRouter();

  const handleRegister = async (e) => {
    e?.preventDefault();
    try {
      const { data } = await axios.post(
        `${mainRoute}/api/auth/register_super`,
        {
          name,
          phoneNumber,
          password,
          code,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (data.success === true) {
        localStorage.setItem("user", JSON.stringify(data));
        toast.success(data.message);
        router.push("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <AuthShell
      title="Create super admin"
      subtitle="This account manages the whole website."
      footer={
        <p>
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="cursor-pointer font-semibold text-maroon-700 hover:text-maroon-800"
          >
            Log in
          </span>
        </p>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <Input
            type="text"
            className="h-11"
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone number
          </label>
          <Input
            type="text"
            inputMode="numeric"
            className="h-11"
            placeholder="Enter your phone number"
            onChange={(e) => setPhoneNumber(e.target.value)}
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
              placeholder="Choose a password"
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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Registration code
          </label>
          <Input
            type="text"
            className="h-11"
            placeholder="Enter the code"
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <Button type="submit" className="mt-2 h-11 w-full cursor-pointer text-base">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
};

export default Register;
