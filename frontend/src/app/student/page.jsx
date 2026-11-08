"use client"
import StudentDashboard from "@/components/students/StudentDashboard"
import AppHeader from "@/components/layout/AppHeader"
import React, { useState } from "react"
import StudentNavbar from "@/components/Student/StudentNavbar"

const Page = () => {
  const [open, setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center">
      <StudentNavbar open={open} setOpen={setOpen} />
      <div className="h-full xl:w-[85%] overflow-hidden">
        <AppHeader setOpen={setOpen} title="Dashboard" />
        <StudentDashboard />
      </div>
    </div>
  )
}

export default Page
