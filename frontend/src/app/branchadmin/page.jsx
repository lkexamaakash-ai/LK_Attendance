"use client"
import BranchNavbar from "@/components/BranchAdmin/BranchNavbar";
import Dash from "@/components/BranchAdmin/Dash";
import Header from "@/components/superAdmin/Header";
import React, { useState } from "react";

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <>
      <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center ">
        <BranchNavbar open={open} setOpen={setOpen} />
        <div className="h-full xl:w-[85%] overflow-hidden ">
          <Header setOpen={setOpen} title={`Dashboard`} username={`Navneet Shahi`} />
          <Dash />
        </div>
      </div>
    </>
  );
};

export default page;
