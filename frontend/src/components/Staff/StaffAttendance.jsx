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

const StaffAttendance = () => {
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

  let cYear = new Date().getFullYear();

  const years = Array.from(
    {
      length: cYear - 2024 + 1,
    },
    (_, i) => 2024 + i,
  );

  const [sortBy, setSortBy] = useState("latest");
  const [mon, setMon] = useState(new Date().getMonth());
  const [yea, setYea] = useState(new Date().getFullYear());

  const attendanceHistoryHeaders = [
    "Date",
    "Shift Time",
    "In Time",
    "Out Time",
    "Late",
    "Overtime (mins)",
    "Overtime Pay (₹)",
    "Late Duration",
    "Penalty",
  ];

  const [attendanceHistoryData, setAttendanceHistoryData] = useState([]);
  const [staffData, setStaffData] = useState([]);

  useEffect(() => {
    let tokn = JSON.parse(localStorage.getItem("user"));
    let token = tokn.data.token;

    const loadData = async () => {
      const { data } = await axios.get(
        `${mainRoute}/api/staffAttendance/report?staffId=${
          tokn.data.user.id
        }&month=${mon + 1}&year=${yea}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const facultyData = data.data;

      setStaffData(facultyData);
    };

    loadData();
  }, [mon, yea]);

  const sortedAttendance = [...attendanceHistoryData]
    .map((item) => {
      if (item.status !== "PRESENT") {
        return {
          ...item,
          calculatedLateMinutes: 0,
        };
      }

      const workingMinutesPerDay =
        item.shiftStartTime && item.shiftEndTime
          ? Math.floor(
              (new Date(item.shiftEndTime) - new Date(item.shiftStartTime)) /
                (1000 * 60),
            )
          : 0;

      const calculatedLateMinutes = calculatePenaltyMinutes({
        workingMinutesPerDay,
        actualIn: item.actualInTime,
        actualOut: item.actualOutTime,
      });

      return {
        ...item,
        calculatedLateMinutes,
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      return sortBy === "latest" ? dateB - dateA : dateA - dateB;
    });

  function calculatePenaltyMinutes({
    workingMinutesPerDay,
    actualIn,
    actualOut,
  }) {
    const GRACE_MINUTES = 15;

    if (!workingMinutesPerDay || !actualIn || !actualOut) {
      return 0;
    }

    const actualInDate = new Date(actualIn);
    const actualOutDate = new Date(actualOut);

    if (isNaN(actualInDate.getTime()) || isNaN(actualOutDate.getTime())) {
      return 0;
    }

    const actualWorkedMinutes = Math.floor(
      (actualOutDate - actualInDate) / (1000 * 60),
    );

    const shortfallMinutes = Math.max(
      0,
      workingMinutesPerDay - actualWorkedMinutes,
    );

    return shortfallMinutes > GRACE_MINUTES ? shortfallMinutes : 0;
  }

  useEffect(() => {
    setAttendanceHistoryData(staffData || []);
  }, [staffData]);

  const formatTime = (isoTime) => {
    if (!isoTime) return "";
    const date = new Date(isoTime);
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  return (
    <>
      <div className="h-full bg-white m-2 rounded flex flex-col overflow-hidden items-center">
        {/* filter */}
        <div className="w-full flex justify-end p-2  gap-2">
          <Label htmlFor={`Sort`} className={`uppercase`}>
            SortBy:
          </Label>
          <Select
            value={list[mon]}
            onValueChange={(v) => setMon(list.indexOf(v))}
          >
            <SelectTrigger id={`Sort`}>
              <SelectValue placeholder={`SortBy`} />
            </SelectTrigger>
            <SelectContent>
              {list.map((item, i) => (
                <SelectItem key={i} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yea} onValueChange={(v) => setYea(v)}>
            <SelectTrigger id={`Sort`}>
              <SelectValue placeholder={`SortBy`} />
            </SelectTrigger>
            <SelectContent>
              {years.map((item, i) => (
                <SelectItem key={i} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Attendance */}

        <div className="w-[98%]  h-[92%] overflow-auto xl:overflow-x-hidden">
          <ul className="grid grid-cols-[100px_180px_260px_220px_140px_140px_150px_190px_180px] xl:grid-cols-9 text-center xl:border-b p-2 font-semibold">
            {attendanceHistoryHeaders.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          {sortedAttendance.map((item, i) => (
            <ul
              key={i}
              className="grid  grid-cols-[100px_180px_260px_220px_140px_140px_150px_190px_180px] xl:grid-cols-9 text-center xl:border-b p-2"
            >
              <li>{formatDate(item.date)}</li>
              <li>{`${formatTime(item.shiftStartTime)}-${formatTime(
                item.shiftEndTime,
              )}`}</li>
              <li>
                {item.status === "PRESENT"
                  ? formatTime(item.actualInTime)
                  : "-"}
              </li>
              <li>
                {item.status === "PRESENT"
                  ? formatTime(item.actualOutTime)
                  : "-"}
              </li>
              <li>
                {item.status === "PRESENT" ? (item.isLate ? "Yes" : "No") : "-"}
              </li>
              <li>
                {item.status === "PRESENT" ? `${item.overtimeMinutes}min` : "-"}
              </li>
              <li
                className={`${
                  item.overtimePay > 0 ? "text-green-600 font-semibold" : ""
                }`}
              >
                ₹{item.overtimePay}
              </li>
              <li>
                {item.status === "PRESENT"
                  ? item.calculatedLateMinutes > 60
                    ? `${(item.calculatedLateMinutes / 60).toPrecision(2)} hrs`
                    : `${item.calculatedLateMinutes} mins`
                  : "-"}
              </li>
              <li
                className={`${
                  item.totalPenalty > 0 ? "text-red-600 font-semibold" : ""
                }`}
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

export default StaffAttendance;
