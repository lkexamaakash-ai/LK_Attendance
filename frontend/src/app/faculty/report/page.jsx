"use client"
import StudentAttendanceReport from "@/components/students/StudentAttendanceReport"
import AppHeader from "@/components/layout/AppHeader"
import React, { useState } from "react"
import FacNavbar from "@/components/Faculty/FacNavbar"

const Page = () => {
  const [open, setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center">
      <FacNavbar open={open} setOpen={setOpen} />
      <div className="h-full xl:w-[85%] overflow-hidden">
        <AppHeader setOpen={setOpen} title="Report" />
        <StudentAttendanceReport role="FACULTY" />
      </div>
    </div>
  )
}

export default Page
