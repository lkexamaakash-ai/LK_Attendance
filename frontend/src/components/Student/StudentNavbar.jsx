"use client";
import { CircleUser, ClipboardCheck, LayoutDashboard } from "lucide-react";
import AppSidebar from "../layout/AppSidebar";

const items = [
  { name: "Dashboard", link: "/student", icon: LayoutDashboard },
  { name: "My Attendance", link: "/student/attendance", icon: ClipboardCheck },
  { name: "My Profile", link: "/student/profile", icon: CircleUser },
];

const StudentNavbar = ({ open, setOpen }) => (
  <AppSidebar items={items} open={open} setOpen={setOpen} roleLabel="Student" />
);

export default StudentNavbar;
