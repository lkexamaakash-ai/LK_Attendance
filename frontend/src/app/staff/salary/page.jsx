"use client"
import StaffHeader from "@/components/Staff/StaffHeader";
import StaffNavbar from "@/components/Staff/StaffNavbar";
import StaffSalary from "@/components/Staff/StaffSalary";
import React, { useState } from "react";

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex">
      <StaffNavbar open={open} setOpen={setOpen} />
      <div className="flex flex-col h-full xl:w-[85vw]">
        <StaffHeader setOpen={setOpen} title={`Salary and OverTime`} user={`Navneet`} />
        <StaffSalary />
      </div>
    </div>
  );
};

export default page;
