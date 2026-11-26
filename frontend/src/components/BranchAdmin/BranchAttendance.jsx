'use client'
import React, { useState } from "react";
import FacultyModal from "./Modal/FacultyModal";
import StaffModal from "./Modal/StaffModal";
import AttendanceHub from "../layout/AttendanceHub";
import StudentAttendanceMarker from "../students/StudentAttendanceMarker";

const BranchAttendance = () => {
  const [facOpen, setFacOpen] = useState(false)
  const [staOpen, setStaOpen] = useState(false)
  const [showStudents, setShowStudents] = useState(false)

  if (showStudents) {
    return <StudentAttendanceMarker role="BRANCH_ADMIN" onBack={() => setShowStudents(false)} />
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
  );
};

export default BranchAttendance;
