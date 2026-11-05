'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import FacultyModal from './Models/FacultyModal'
import StaffModal from './Models/StaffModal'

const Attendance = () => {

    const [staOpen,setStaOpen] = useState(false)
    const [facOpen,setFacOpen] = useState(false)
  return (
      <>
      <div className="h-[91%] rounded-xl border border-stone-200 shadow-sm flex justify-center bg-white m-2 items-center flex-col pt-10">
      {/* <div className="h-[91%] bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden gap-5 p-4 py-6 flex-wrap "> */}


        <h1 className='text-3xl font-bold'>Mark Attendance</h1>
        <div className="h-full w-full flex flex-col xl:flex-row justify-center items-center [&>div]:flex [&>div]:flex-col [&>div]:justify-center [&>div]:items-center [&>div]:h-[35vh] [&>div]:w-[50vw] xl:[&>div]:h-[45vh] xl:[&>div]:w-[38vw] gap-10 [&>div]:bg-[#BE6B66] [&>div]:rounded-2xl [&>div]:shadow-2xl [&>div]:hover:scale-[1.02] xl:[&>div]:hover:scale-[1.1] [&>div]:cursor-pointer duration-500 ease-linear transition-all">
            <div onClick={()=>setStaOpen(true)} className=" text-lg gap-5 xl:text-2xl font-bold text-white text-shadow-2xl text-shadow-black text-center">
                <Image src={'/staff.png'} alt='staff' width={200} height={200} />
                <h1 className="">Mark Staff Attendance</h1>
            </div>
            <div onClick={()=>setFacOpen(true)} className=" text-lg gap-5 xl:text-2xl font-bold text-white text-shadow-2xl text-shadow-black text-center">
                <Image src={'/staff.png'} alt='staff' width={200} height={200} />
                <h1 className="">Mark Faculty Attendance</h1>
            </div>
        </div>
      </div>

      <FacultyModal open={facOpen} setOpen={setFacOpen} />
      <StaffModal open={staOpen} setOpen={setStaOpen} />

    </>
  )
}

export default Attendance