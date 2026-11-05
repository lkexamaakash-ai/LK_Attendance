"use client"
import BranchManagement from "@/components/superAdmin/BranchManagement";
import Header from "@/components/superAdmin/Header";
import Navbar from "@/components/superAdmin/Navbar";
import React, { useState } from "react";

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className="h-screen xl:w-full overflow-hidden bg-app xl:flex items-center ">
        <Navbar open={open} setOpen={setOpen} />
        <div className="h-full xl:w-[85%] overflow-hidden">
            <Header setOpen={setOpen} title={`Branch Management`} username={`Navneet Shahi`} />
            <BranchManagement />
        </div>
    </div>
  );
};

export default page;
