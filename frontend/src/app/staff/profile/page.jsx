"use client"
import StaffHeader from "@/components/Staff/StaffHeader";
import StaffNavbar from "@/components/Staff/StaffNavbar";
import StaffProfile from "@/components/Staff/StaffProfile";
import React, { useState } from "react";

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex">
      <StaffNavbar open={open} setOpen={setOpen}/>
      <div className="flex flex-col xl:w-[85vw]">
        <StaffHeader setOpen={setOpen} title={`Profile`} user={`Navneet`} />
        <StaffProfile />
      </div>
    </div>
  );
};

export default page;
