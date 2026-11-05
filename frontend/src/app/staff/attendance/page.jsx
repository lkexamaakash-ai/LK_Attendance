"use client"
import StaffAttendance from "@/components/Staff/StaffAttendance";
import StaffHeader from "@/components/Staff/StaffHeader";
import StaffMain from "@/components/Staff/StaffMain";
import StaffNavbar from "@/components/Staff/StaffNavbar";
import React, { useState } from "react";

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className="h-screen w-full bg-app xl:flex items-center">
      <StaffNavbar open={open} setOpen={setOpen} />
      <div className="flex h-full flex-col xl:w-[85vw] overflow-hidden ">
        <StaffHeader setOpen={setOpen} title={`My Attendance`} user={`Navneet`} />
        {/* <StaffMain /> */}
        <StaffAttendance />
      </div>
    </div>
  );
};

export default page;
