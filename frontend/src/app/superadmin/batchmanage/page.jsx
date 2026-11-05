"use client"
import BatchManagement from "@/components/superAdmin/BatchManagement";
import Header from "@/components/superAdmin/Header";
import { MainBoard } from "@/components/superAdmin/MainBoard";
import Navbar from "@/components/superAdmin/Navbar";
import React, { useState } from "react";

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <>
      <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center ">
        <Navbar open={open} setOpen={setOpen} />
        <div className="h-full w-full xl:w-[85%]  overflow-hidden ">
          <Header setOpen={setOpen} title={`Dashboard`} username={`Navneet Shahi`} />
          <BatchManagement />
        </div>
      </div>
    </>
  );
};

export default page;
