"use client"
import Header from '@/components/superAdmin/Header'
import LectureManagement from '@/components/superAdmin/LectureManagement'
import Navbar from '@/components/superAdmin/Navbar'
import UserManagement from '@/components/superAdmin/UserManagement'
import React, { useState } from 'react'

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center ">
        <Navbar open={open} setOpen={setOpen} />
        <div className="h-full xl:w-[85%] overflow-hidden ">
            <Header setOpen={setOpen} title={`Lecture Management`} username={`Navneet Shahi`} />
            <LectureManagement />
        </div>
    </div>
  )
}

export default page