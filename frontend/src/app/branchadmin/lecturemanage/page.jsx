"use client"
import BranchNavbar from "@/components/BranchAdmin/BranchNavbar";
import Lecture from "@/components/BranchAdmin/Lecture";
import Header from "@/components/superAdmin/Header";
import React, { useState } from "react";

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <>
      <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center ">
        <BranchNavbar open={open} setOpen={setOpen} />
        <div className="h-full xl:w-[85%] overflow-hidden ">
          <Header setOpen={setOpen} title={`Lecture Management`} username={`Navneet Shahi`} />
          <Lecture />
        </div>
      </div>
    </>
  );
};

export default page;
