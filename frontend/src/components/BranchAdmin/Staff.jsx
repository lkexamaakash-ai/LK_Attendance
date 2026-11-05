"use client";
import { useManagement } from "@/context/ManagementContext";
import React, { useEffect, useState } from "react";

const Staff = () => {
  const staffHeaders = [
    "Staff Name",
    "Phone No.",
    "Shift Time",
    "End Time",
    "Days Present",
    "Late Days",
    "Total Late Minutes",
    "Total Overtime (mins)",
    "Overtime Pay (₹)",
    "Total Penalty",
  ];

  const { fetchUser } = useManagement();

  const [staffData, setStaffData] = useState([]);

  const getCurrentMonthRange = () => {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return { startOfMonth, endOfMonth };
  };

  const getCurrentMonthStaffAttendances = (staffAttendances) => {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    return staffAttendances.filter((att) => {
      const attDate = new Date(att.date);
      return attDate >= startOfMonth && attDate <= endOfMonth;
    });
  };

  const getStaffStats = (staffAttendances) => {
    const currentMonthData = getCurrentMonthStaffAttendances(staffAttendances);

    return currentMonthData.reduce(
      (acc, att) => {
        acc.daysPresent += 1;

        if (att.isLate) {
          acc.lateDays += 1;
          acc.totalLateMinutes += att.lateMinutes || 0;
        }

        acc.totalOvertimeMinutes += att.overtimeMinutes || 0;
        acc.totalOvertimePay += att.overtimePay || 0;
        acc.totalPenalty += att.totalPenalty || 0;

        return acc;
      },
      {
        daysPresent: 0,
        lateDays: 0,
        totalLateMinutes: 0,
        totalOvertimeMinutes: 0,
        totalOvertimePay: 0,
        totalPenalty: 0,
      },
    );
  };

  useEffect(() => {
    const loaddata = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const branchId = user.data.user.branchId;
      console.log(branchId);

      const userDate = await fetchUser();

      const filterData = userDate
        .filter((user) => user.role === "STAFF" && user.isActive)
        .filter((user) => user.branchId === branchId);
      console.log(filterData);
      setStaffData(filterData);
    };

    loaddata();
  }, []);

  const formatTime = (isoTime) => {
    if (!isoTime) return "";
    const date = new Date(isoTime);
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <div className="h-[91%] bg-white m-2 rounded-xl border border-stone-200 shadow-sm p-4 py-6 flex flex-wrap gap-5 flex-col items-center">
        <div className="w-full h-[99%] overflow-auto xl:overflow-x-hidden">
          <ul
            className="grid grid-cols-[100px_250px_150px_150px_140px_140px_160px_140px_120px_120px]
          px-4 py-3 xl:grid-cols-10   font-semibold rounded-lg border border-maroon-100 bg-maroon-50 text-maroon-800 text-center "
          >
            {staffHeaders.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          {staffData.map((staff, i) => {
            const stats = getStaffStats(staff.staffAttendances);
            return (
              <ul
                key={i}
                className="border-b border-stone-200 text-slate-700 transition-colors grid grid-cols-[100px_250px_150px_150px_140px_140px_160px_140px_120px_120px] xl:grid-cols-10 px-4 py-3   text-center items-center text-wrap hover:bg-maroon-50/70"
              >
                <li>{staff.name}</li>
                <li>{staff.phoneNumber}</li>
                <li>{formatTime(staff.shiftStartTime)}</li>
                <li>{formatTime(staff.shiftEndTime)}</li>
                <li>{stats.daysPresent}</li>
                <li>{stats.lateDays}</li>
                <li>{stats.totalLateMinutes}</li>
                <li>{stats.totalOvertimeMinutes}</li>
                <li className="text-green-600 font-semibold">
                  ₹{stats.totalOvertimePay}
                </li>
                <li className="text-red-600 font-semibold">
                  ₹{stats.totalPenalty}
                </li>
              </ul>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Staff;
