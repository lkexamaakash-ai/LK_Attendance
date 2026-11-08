"use client"
import StudentList from "@/components/students/StudentList"
import AppHeader from "@/components/layout/AppHeader"
import React, { useState } from "react"
import BranchNavbar from "@/components/BranchAdmin/BranchNavbar"

const Page = () => {
  const [open, setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center">
      <BranchNavbar open={open} setOpen={setOpen} />
      <div className="h-full xl:w-[85%] overflow-hidden">
        <AppHeader setOpen={setOpen} title="Student Management" />
        <StudentList role="BRANCH_ADMIN" basePath="/branchadmin/students" />
      </div>
    </div>
  )
}

export default Page
