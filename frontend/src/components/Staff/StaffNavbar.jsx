"use client";
import { LayoutDashboard, CalendarCheck, Wallet, CircleUser } from "lucide-react";
import AppSidebar from "../layout/AppSidebar";

const items = [
  { name: "Dashboard", link: "/staff", icon: LayoutDashboard },
  { name: "My Attendance", link: "/staff/attendance", icon: CalendarCheck },
  { name: "Salary & Overtime", link: "/staff/salary", icon: Wallet },
  { name: "Profile", link: "/staff/profile", icon: CircleUser },
];

const StaffNavbar = ({ open, setOpen }) => (
  <AppSidebar items={items} open={open} setOpen={setOpen} roleLabel="Staff" />
);

export default StaffNavbar;
