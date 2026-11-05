'use client'
import StaffHeader from "@/components/Staff/StaffHeader";
import StaffMain from "@/components/Staff/StaffMain";
import StaffNavbar from "@/components/Staff/StaffNavbar";
import React, { useState } from "react";

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex">
      <StaffNavbar open={open} setOpen={setOpen}  />
      <div className="flex flex-col xl:w-[85vw] h-full">
        <StaffHeader setOpen={setOpen}  title={`Dashboard`} user={`Navneet`} />
        <StaffMain />
      </div>
    </div>
  );
};

export default page;
