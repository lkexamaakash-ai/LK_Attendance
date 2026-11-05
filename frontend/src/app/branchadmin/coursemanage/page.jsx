"use client";
import BatchManagement from "@/components/BranchAdmin/BatchManagement";
import BranchNavbar from "@/components/BranchAdmin/BranchNavbar";
import CourseManagement from "@/components/BranchAdmin/CourseManagment";
import Header from "@/components/superAdmin/Header";
import React, { useState } from "react";

const page = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center ">
        <BranchNavbar open={open} setOpen={setOpen} />
        <div className="h-full xl:w-[85%] overflow-hidden ">
          <Header
            setOpen={setOpen}
            title={`Dashboard`}
            username={`Navneet Shahi`}
          />
          <CourseManagement />
        </div>
      </div>
    </>
  );
};

export default page;
