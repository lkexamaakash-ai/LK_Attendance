"use client"
import StudentProfileView from "@/components/students/StudentProfileView"
import StudentPasswordCard from "@/components/students/StudentPasswordCard"
import AppHeader from "@/components/layout/AppHeader"
import StudentNavbar from "@/components/Student/StudentNavbar"
import React, { useState } from "react"

const Page = () => {
  const [open, setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center">
      <StudentNavbar open={open} setOpen={setOpen} />
      <div className="h-full xl:w-[85%] overflow-hidden">
        <AppHeader setOpen={setOpen} title="My Profile" />
        <StudentProfileView mode="student">
          <StudentPasswordCard />
        </StudentProfileView>
      </div>
    </div>
  )
}

export default Page
