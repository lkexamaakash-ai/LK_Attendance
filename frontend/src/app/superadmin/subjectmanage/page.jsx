"use client"
import Header from '@/components/superAdmin/Header'
import Navbar from '@/components/superAdmin/Navbar'
import SubjectManagement from '@/components/superAdmin/SubjectManagement'
import React, { useState } from 'react'

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center ">
        <Navbar open={open} setOpen={setOpen} />
        <div className="h-full xl:w-[85%]  overflow-hidden ">
            <Header setOpen={setOpen} title={`Subject Management`} username={`Navneet Shahi`} />
            <SubjectManagement />
        </div>
    </div>
  )
}

export default page