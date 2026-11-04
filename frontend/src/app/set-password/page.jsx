"use client";
import { mainRoute } from "@/components/apiroute";
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

  const handleSubmit = async () => {
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
    <div className="h-screen w-full flex justify-center items-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] lg:w-[35%] py-10 flex flex-col items-center">
        <img src="/Header.jpg" alt="" className="h-20" />
        <div className="flex flex-col gap-3 w-[90%] mt-10">
          <h1 className="text-center text-2xl mb-2 font-semibold">
            Set Your Password
          </h1>
          <p className="text-center text-sm text-gray-600 mb-5">
            You are using the default password. Please choose a new password to
            continue.
          </p>

          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black bg-transparent hover:bg-transparent"
            >
              {!showPass ? <Eye size={10} /> : <EyeOff size={10} />}
            </Button>
          </div>

          <Input
            type={showPass ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            variant="secondary"
            onClick={handleSubmit}
            disabled={loading}
            className="cursor-pointer my-5"
          >
            {loading ? "Saving..." : "Set Password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
