"use client";
import { CircleUser, LayoutDashboard } from "lucide-react";
import AppSidebar from "../layout/AppSidebar";

const items = [
  { name: "Dashboard", link: "/student", icon: LayoutDashboard },
  { name: "My Profile", link: "/student/profile", icon: CircleUser },
];

const StudentNavbar = ({ open, setOpen }) => (
  <AppSidebar items={items} open={open} setOpen={setOpen} roleLabel="Student" />
);

export default StudentNavbar;
