"use client"
import StudentProfileView from "@/components/students/StudentProfileView"
import AppHeader from "@/components/layout/AppHeader"
import BranchNavbar from "@/components/BranchAdmin/BranchNavbar"
import { useParams } from "next/navigation"
import React, { useState } from "react"

const Page = () => {
  const { id } = useParams()
  const [open, setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center">
      <BranchNavbar open={open} setOpen={setOpen} />
      <div className="h-full xl:w-[85%] overflow-hidden">
        <AppHeader setOpen={setOpen} title="Student Profile" />
        <StudentProfileView mode="admin" studentId={id} backPath="/branchadmin/students" />
      </div>
    </div>
  )
}

export default Page
