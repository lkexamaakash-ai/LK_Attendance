"use client";

import React, { useEffect, useState } from "react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";
import { mainRoute } from "../apiroute";

const StaffSalary = () => {
  const list = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  const cYear = new Date().getFullYear();

  const years = Array.from(
    {
      length: cYear - 2024 + 1,
    },
    (_, i) => 2024 + i,
  );

  const salaryTableHeaders = [
    "Date",
    "In Time",
    "Out Time",
    "Late",
    "Overtime (mins)",
    "Overtime Pay (₹)",
    "Late Duration (mins)",
    "Penalty",
  ];

  const formatTime = (iso) => {
    if (!iso) return "";

    const date = new Date(iso);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  /*
   * Calculate penalty minutes
   *
   * Logic:
   * required working minutes = scheduledOut - scheduledIn
   * actual working minutes   = actualOut - actualIn
   * shortfall                = required - actual
   *
   * If shortfall > 15 minutes,
   * shortfall will be considered penalty minutes.
   */
  // function calculatePenaltyMinutes({
  //   scheduledIn,
  //   scheduledOut,
  //   actualIn,
  //   actualOut,
  // }) {
  //   const GRACE_MINUTES = 15;

  //   if (!scheduledIn || !scheduledOut || !actualIn || !actualOut) {
  //     return 0;
  //   }

  //   const scheduledStart = new Date(scheduledIn);
  //   const scheduledEnd = new Date(scheduledOut);

  //   const actualStart = new Date(actualIn);
  //   const actualEnd = new Date(actualOut);

  //   const workingMinutesPerDay = Math.floor(
  //     (scheduledEnd - scheduledStart) / (1000 * 60),
  //   );

  //   const actualWorkedMinutes = Math.floor(
  //     (actualEnd - actualStart) / (1000 * 60),
  //   );

  //   if (workingMinutesPerDay <= 0 || actualWorkedMinutes < 0) {
  //     return 0;
  //   }

  //   const shortfallMinutes = Math.max(
  //     0,
  //     workingMinutesPerDay - actualWorkedMinutes,
  //   );

  //   return shortfallMinutes > GRACE_MINUTES ? shortfallMinutes : 0;
  // }

  function calculateLateMinutes({ scheduledIn, actualIn }) {
    const GRACE_MINUTES = 15;

    if (!scheduledIn || !actualIn) {
      return 0;
    }

    const lateMinutes = Math.floor(
      (new Date(actualIn) - new Date(scheduledIn)) / (1000 * 60),
    );

    return lateMinutes > GRACE_MINUTES ? lateMinutes : 0;
  }

  function calculatePenaltyMinutes({
    workingMinutesPerDay,
    actualIn,
    actualOut,
  }) {
    const GRACE_MINUTES = 15;

    if (!workingMinutesPerDay || !actualIn || !actualOut) {
      return 0;
    }

    const actualInTime = new Date(actualIn);
    const actualOutTime = new Date(actualOut);

    if (isNaN(actualInTime.getTime()) || isNaN(actualOutTime.getTime())) {
      return 0;
    }

    const actualWorkedMinutes = Math.floor(
      (actualOutTime - actualInTime) / (1000 * 60),
    );

    const shortfallMinutes = Math.max(
      0,
      workingMinutesPerDay - actualWorkedMinutes,
    );

    return shortfallMinutes > GRACE_MINUTES ? shortfallMinutes : 0;
  }

  const [staffData, setStaffData] = useState({});

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [selectYear, setSelectedYear] = useState(new Date().getFullYear());

  const [salaryTableData, setSalaryTableData] = useState([]);

  // Load staff data
  useEffect(() => {
    const tokn = JSON.parse(localStorage.getItem("user"));

    if (!tokn?.data?.token || !tokn?.data?.user?.id) {
      console.error("User/token not found");
      return;
    }

    const token = tokn.data.token;

    const loadData = async () => {
      try {
        const { data } = await axios.get(
          `${mainRoute}/api/users/role/dash?userId=${tokn.data.user.id}&branchId=${tokn.data.user.branch.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const facultyData = data?.data?.faculty;


        setStaffData(facultyData || {});
      } catch (error) {
        console.error(
          "Failed to load staff data:",
          error.response?.data || error.message,
        );
      }
    };

    loadData();
  }, []);

  // Prepare salary table
  useEffect(() => {
    const monthAttendances =
      staffData?.staffAttendances?.filter((att) => {
        const d = new Date(att.date);

        return d.getMonth() === selectedMonth && d.getFullYear() === selectYear;
      }) || [];


    const tableData = monthAttendances.map((att) => {
      const workingMinutesPerDay =
        att.shiftStartTime && att.shiftEndTime
          ? Math.floor(
              (new Date(att.shiftEndTime) - new Date(att.shiftStartTime)) /
                (1000 * 60),
            )
          : 0;

      const penaltyMinutes = calculatePenaltyMinutes({
        workingMinutesPerDay,
        actualIn: att.actualInTime,
        actualOut: att.actualOutTime,
      });

      return {
        date: formatDate(att.date),
        inTime: formatTime(att.actualInTime),
        outTime: att.actualOutTime ? formatTime(att.actualOutTime) : "-",
        late: att.isLate ? "Yes" : "No",
        overtimeMinutes: att.overtimeMinutes || 0,
        overtimePay: att.overtimePay || 0,

        lateMinutes: penaltyMinutes,

        totalPenalty: att.totalPenalty || 0,
        status: att.status,
      };
    });


    setSalaryTableData(tableData);
  }, [selectedMonth, selectYear, staffData]);

  const totalOvertimePay = salaryTableData.reduce(
    (sum, att) => sum + (att.overtimePay || 0),
    0,
  );

  const totalPenalty = salaryTableData.reduce(
    (sum, att) => sum + (att.totalPenalty || 0),
    0,
  );

  return (
    <>
      <div className="h-full bg-white m-2 gap-2 rounded flex flex-col overflow-hidden p-5">
        {/* Filters */}
        <div className="w-full flex justify-end p-2 gap-2">
          <Label htmlFor="month" className="uppercase">
            SortBy:
          </Label>

          {/* Month */}
          <Select
            value={list[selectedMonth]}
            onValueChange={(v) => setSelectedMonth(list.indexOf(v))}
          >
            <SelectTrigger id="month">
              <SelectValue placeholder="Month" />
            </SelectTrigger>

            <SelectContent>
              {list.map((item, i) => (
                <SelectItem key={i} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year */}
          <Select
            value={String(selectYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger id="year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>

            <SelectContent>
              {years.map((item) => (
                <SelectItem key={item} value={String(item)}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="flex gap-4">
          {/* Overtime */}
          <div className="bg-gray-100 w-[98%] xl:h-[20vh] xl:w-[30vw] rounded p-2 py-4 flex flex-col justify-between relative">
            <h1 className="font-semibold text-xl">
              Net OverTime Pay(Current month)
            </h1>

            <p className="text-6xl text-green-600">₹{totalOvertimePay}</p>
          </div>

          {/* Penalty */}
          <div className="bg-gray-100 w-[98%] xl:h-[20vh] xl:w-[30vw] rounded p-2 py-4 flex flex-col justify-between relative">
            <h1 className="font-semibold text-xl">
              Net Penalties Pay(Current month)
            </h1>

            <p className="text-6xl text-red-600">₹{totalPenalty}</p>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-gray-100 h-[91%] overflow-auto w-[98%] rounded p-2 pb-4 pt-0 flex flex-col xl:justify-start relative">
          <div className="sticky top-0 bg-gray-100 pt-2">
            <h1 className="font-semibold uppercase">Overtimes</h1>

            <ul className="grid grid-cols-[100px_180px_260px_220px_140px_140px_150px_150px] xl:grid-cols-8 text-center border-b p-2 font-semibold">
              {salaryTableHeaders.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {salaryTableData.map((item, i) => (
            <ul
              key={i}
              className="grid grid-cols-[100px_180px_260px_220px_140px_140px_150px_150px] xl:grid-cols-8 text-center border-b p-2"
            >
              <li>{item.date}</li>

              <li>{item.status === "PRESENT" ? item.inTime : "-"}</li>

              <li>{item.status === "PRESENT" ? item.outTime : "-"}</li>

              <li>{item.status === "PRESENT" ? item.late : "-"}</li>

              <li>{item.status === "PRESENT" ? item.overtimeMinutes : "-"}</li>

              <li
                className={
                  item.overtimePay > 0 ? "text-green-600 font-semibold" : ""
                }
              >
                ₹{item.overtimePay}
              </li>

              <li>{item.status === "PRESENT" ? item.lateMinutes > 60 ? `${(item.lateMinutes/60).toPrecision(2)} hrs` : `${item.lateMinutes} mins` : "-"}</li>

              <li
                className={
                  item.totalPenalty > 0 ? "text-red-600 font-semibold" : ""
                }
              >
                ₹{item.totalPenalty}
              </li>
            </ul>
          ))}
        </div>
      </div>
    </>
  );
};

export default StaffSalary;
