'use client'
import React, { useState } from 'react'
import FacultyModal from './Models/FacultyModal'
import StaffModal from './Models/StaffModal'
import AttendanceHub from '../layout/AttendanceHub'
import StudentAttendanceMarker from '../students/StudentAttendanceMarker'

const Attendance = () => {
  const [staOpen, setStaOpen] = useState(false)
  const [facOpen, setFacOpen] = useState(false)
  const [showStudents, setShowStudents] = useState(false)

  if (showStudents) {
    return <StudentAttendanceMarker role="SUPER_ADMIN" onBack={() => setShowStudents(false)} />
  }

  return (
    <>
      <AttendanceHub
        onStaff={() => setStaOpen(true)}
        onFaculty={() => setFacOpen(true)}
        onStudent={() => setShowStudents(true)}
      />

      <FacultyModal open={facOpen} setOpen={setFacOpen} />
      <StaffModal open={staOpen} setOpen={setStaOpen} />
    </>
  )
}

export default Attendance
