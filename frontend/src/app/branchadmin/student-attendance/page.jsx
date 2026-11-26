"use client"
import StudentAttendanceMarker from "@/components/students/StudentAttendanceMarker"
import AppHeader from "@/components/layout/AppHeader"
import React, { useState } from "react"
import BranchNavbar from "@/components/BranchAdmin/BranchNavbar"

const Page = () => {
  const [open, setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center">
      <BranchNavbar open={open} setOpen={setOpen} />
      <div className="h-full xl:w-[85%] overflow-hidden">
        <AppHeader setOpen={setOpen} title="Student Attendance" />
        <StudentAttendanceMarker role="BRANCH_ADMIN" />
      </div>
    </div>
  )
}

export default Page
