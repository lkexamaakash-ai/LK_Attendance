"use client";
import { LayoutDashboard, Building2, BookOpen, Layers, Library, Presentation, CalendarCheck, UserCog, ChartColumn, History, CircleUser } from "lucide-react";
import AppSidebar from "../layout/AppSidebar";

const items = [
  { name: "Dashboard", link: "/superadmin", icon: LayoutDashboard },
  { name: "Branch Management", link: "/superadmin/branchmanage", icon: Building2 },
  { name: "Course Management", link: "/superadmin/coursemanage", icon: BookOpen },
  { name: "Batch Management", link: "/superadmin/batchmanage", icon: Layers },
  { name: "Subject Management", link: "/superadmin/subjectmanage", icon: Library },
  { name: "Lecture Management", link: "/superadmin/lecturemanage", icon: Presentation },
  { name: "Attendance", link: "/superadmin/attendance", icon: CalendarCheck },
  { name: "User Management", link: "/superadmin/usermanage", icon: UserCog },
  { name: "Report", link: "/superadmin/report", icon: ChartColumn },
  { name: "Historical Data", link: "/superadmin/uploadfile", icon: History },
  { name: "Profile", link: "/superadmin/profile", icon: CircleUser },
];

const Navbar = ({ open, setOpen }) => (
  <AppSidebar items={items} open={open} setOpen={setOpen} roleLabel="Super Admin" />
);

export default Navbar;
