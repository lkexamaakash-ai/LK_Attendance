'use client'
import Header from '@/components/superAdmin/Header'
import Navbar from '@/components/superAdmin/Navbar'
import Report from '@/components/superAdmin/Report'
import React, { useState } from 'react'

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className="h-screen w-full overflow-hidden bg-app xl:flex items-center ">
        <Navbar open={open} setOpen={setOpen} />
        <div className="h-full xl:w-[85%]  overflow-hidden ">
            <Header setOpen={setOpen} title={`Report`} username={`Navneet Shahi`} />
            {/* <Attendance /> */}
            <Report />
        </div>
    </div>
  )
}

export default page