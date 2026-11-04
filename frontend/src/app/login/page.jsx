"use client";
import { mainRoute } from "@/components/apiroute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    try {
      const { data } = await axios.post(
        `${mainRoute}/api/auth/login`,
        { phoneNumber, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
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
    <div className="h-screen w-full overflow-hidden relative bg-gray-100 lg:bg-[url('/bg2.png')] bg-cover bg-center flex justify-center items-center lg:scale-x-[-1]">
      <div className="lg:absolute m-2 rounded-2xl lg:right-0 bg-white min-h-[60%] w-[90%] lg:h-[95%] lg:w-[40%] shadow-2xl flex flex-col items-center py-10 lg:scale-x-[-1] ">
        <div className="">
          <img src="/Header.jpg" alt="" className="h-20" />
        </div>

        <div className="flex flex-col gap-3 w-[90%] mt-10 ">
          <h1 className="text-center text-3xl mb-10 font-semibold">Login</h1>

          <Input
            type={`text`}
            inputType={`numeric`}
            maxLength={10}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={`Enter Your Phone Number`}
          />
          <div className="relative">
            <Input
              type={`${showPass ? "text" : "password"}`}
              placeholder={"Enter Your Password"}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              onClick={() => setShowPass(!showPass)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black bg-transparent hover:bg-transparent `}
            >
              {!showPass ? <Eye size={10} /> : <EyeOff size={10} />}
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={handleLogin}
            className={`cursor-pointer my-10`}
          >
            Login
          </Button>
        </div>
        <div className="">
          <p className="text-sm">
            If not able to Login contact{" "}
            <a href={`mailto:lkacademysurat@gmail.com`}>
              <span className="text-blue-700 cursor-pointer font-semibold">
                Admin
              </span>
            </a>
          </p>
        </div>
        <div className="mt-5">
          <p className="text-sm">
            <span
              onClick={() => router.push("/register")}
              className="text-blue-700 cursor-pointer font-semibold"
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
