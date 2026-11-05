"use client"
import FacHeader from '@/components/Faculty/FacHeader'
import FacMain from '@/components/Faculty/FacMain'
import FacNavbar from '@/components/Faculty/FacNavbar'
import Header from '@/components/superAdmin/Header'
import React, { useState } from 'react'

const page = () => {
  const [open,setOpen] = useState(false)
  return (
    <div className='h-screen w-full overflow-hidden bg-app xl:flex'>
        <FacNavbar open={open} setOpen={setOpen} />
        <div className="flex flex-col overflow-hidden h-full xl:w-[85vw]">
            <Header setOpen={setOpen} title={"Dashboard"} />
            <FacMain />
        </div>
    </div>
  )
}

export default page