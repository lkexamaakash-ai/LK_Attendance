'use client'
import Image from "next/image";
import React, { useState } from "react";
import FacultyModal from "./Modal/FacultyModal";
import StaffModal from "./Modal/StaffModal";

const BranchAttendance = () => { 
  const [facOpen,setFacOpen] = useState(false)
  const [staOpen,setStaOpen] = useState(false)
  return (
    <>
      <div className="h-[91%] bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex justify-center items-center flex-col pt-10 ">
        <h1 className="text-3xl font-bold">Mark Attendance</h1>

        <div className="h-full w-full flex flex-col xl:flex-row justify-center items-center [&>div]:flex [&>div]:flex-col [&>div]:justify-center [&>div]:items-center [&>div]:h-[35vh] [&>div]:w-[50vw] xl:[&>div]:h-[45vh] xl:[&>div]:w-[38vw] gap-10 [&>div]:bg-[#BE6B66] [&>div]:rounded-2xl [&>div]:shadow-2xl [&>div]:hover:scale-[1.02] xl:[&>div]:hover:scale-[1.1] [&>div]:cursor-pointer duration-500 ease-linear transition-all">
          <div onClick={()=>setStaOpen(true)} className=" text-lg gap-5 xl:text-2xl font-bold text-white text-shadow-2xl text-shadow-black text-center">
            <Image src={"/staff.png"} alt="staff" width={200} height={200} />
            <h1 className="">Mark Staff Attendance</h1>
          </div>

          <div onClick={()=>setFacOpen(true)} className=" text-lg gap-5 xl:text-2xl font-bold text-white text-shadow-2xl text-shadow-black text-center">
            <Image src={"/staff.png"} alt="staff" width={200} height={200} />
            <h1 className="">Mark Faculty Attendance</h1>
          </div>
        </div>
      </div>

      <FacultyModal open={facOpen} setOpen={setFacOpen}/>
      <StaffModal open={staOpen} setOpen={setStaOpen} />
    </>
  );
};

export default BranchAttendance;
