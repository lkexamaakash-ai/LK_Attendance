'use client'
import React, { useState } from "react";
import FacultyModal from "./Modal/FacultyModal";
import StaffModal from "./Modal/StaffModal";
import AttendanceHub from "../layout/AttendanceHub";

const BranchAttendance = () => {
  const [facOpen, setFacOpen] = useState(false)
  const [staOpen, setStaOpen] = useState(false)
  return (
    <>
      <AttendanceHub
        onStaff={() => setStaOpen(true)}
        onFaculty={() => setFacOpen(true)}
      />

      <FacultyModal open={facOpen} setOpen={setFacOpen} />
      <StaffModal open={staOpen} setOpen={setStaOpen} />
    </>
  );
};

export default BranchAttendance;
