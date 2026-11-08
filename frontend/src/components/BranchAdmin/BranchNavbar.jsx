"use client";
import { Users, LayoutDashboard, GraduationCap, Briefcase, Library, BookOpen, Layers, Presentation, CalendarCheck, ChartColumn, History, CircleUser } from "lucide-react";
import AppSidebar from "../layout/AppSidebar";

const items = [
  { name: "Dashboard", link: "/branchadmin", icon: LayoutDashboard },
  { name: "Faculty", link: "/branchadmin/faculty", icon: GraduationCap },
  { name: "Staff", link: "/branchadmin/staff", icon: Briefcase },
  { name: "Students", link: "/branchadmin/students", icon: Users },
  { name: "Subject Management", link: "/branchadmin/subjectmanagement", icon: Library },
  { name: "Course Management", link: "/branchadmin/coursemanage", icon: BookOpen },
  { name: "Batch Management", link: "/branchadmin/batchmanage", icon: Layers },
  { name: "Lecture Management", link: "/branchadmin/lecturemanage", icon: Presentation },
  { name: "Attendance", link: "/branchadmin/attendance", icon: CalendarCheck },
  { name: "Report", link: "/branchadmin/report", icon: ChartColumn },
  { name: "Historical Data", link: "/branchadmin/history", icon: History },
  { name: "Profile", link: "/branchadmin/profile", icon: CircleUser },
];

const BranchNavbar = ({ open, setOpen }) => (
  <AppSidebar items={items} open={open} setOpen={setOpen} roleLabel="Branch Admin" />
);

export default BranchNavbar;
