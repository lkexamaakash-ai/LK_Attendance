'use client'
import React, { useState } from 'react'
import FacultyModal from './Models/FacultyModal'
import StaffModal from './Models/StaffModal'
import AttendanceHub from '../layout/AttendanceHub'

const Attendance = () => {
  const [staOpen, setStaOpen] = useState(false)
  const [facOpen, setFacOpen] = useState(false)
  return (
    <>
      <AttendanceHub
        onStaff={() => setStaOpen(true)}
        onFaculty={() => setFacOpen(true)}
      />

      <FacultyModal open={facOpen} setOpen={setFacOpen} />
      <StaffModal open={staOpen} setOpen={setStaOpen} />
    </>
  )
}

export default Attendance
