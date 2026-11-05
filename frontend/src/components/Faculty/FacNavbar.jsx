"use client";
import { LayoutDashboard, CalendarCheck, BookMarked, CircleUser } from "lucide-react";
import AppSidebar from "../layout/AppSidebar";

const items = [
  { name: "Dashboard", link: "/faculty", icon: LayoutDashboard },
  { name: "Attendance", link: "/faculty/attendance", icon: CalendarCheck },
  { name: "My Subject & Batches", link: "/faculty/lecture", icon: BookMarked },
  { name: "Profile", link: "/faculty/profile", icon: CircleUser },
];

const FacNavbar = ({ open, setOpen }) => (
  <AppSidebar items={items} open={open} setOpen={setOpen} roleLabel="Faculty" />
);

export default FacNavbar;
