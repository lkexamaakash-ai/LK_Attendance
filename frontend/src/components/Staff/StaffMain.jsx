"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { mainRoute } from "../apiroute";

const StaffMain = () => {
  // Helper Function
  const getTodayDateString = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const toISTDateString = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
  };

  const recentAtt = [
    "Date",
    "In Time",
    "Out Time",
    "Late",
    "Overtime",
    "Overtime Pay",
  ];

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
    });

  const [staffData, setStaffData] = useState({});
  const [todayAtt, setTodayAtt] = useState({});
  const [overtime, setOvertime] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    let tokn = JSON.parse(localStorage.getItem("user"));
    let token = tokn.data.token;
    // setBranch(tokn.data.user.branch);

    const loadData = async () => {
      const { data } = await axios.get(
        `${mainRoute}/api/users/role/dash?userId=${tokn.data.user.id}&branchId=${tokn.data.user.branch.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // const facultyData = data.data.faculty
      //   .filter((user) => user.id === tokn.data.user.id)
      //   .find((user) => user.branchId === tokn.data.user.branch.id);

      const facultyData = data.data.faculty;
      

      setStaffData(facultyData);

      const lectur = data.data.lectures.filter(
        (lec) => lec.facultyId === tokn.data.user.id,
      );
    };

    loadData();
  }, []);

  useEffect(() => {
    const todayIST = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const todayAttendance = staffData?.staffAttendances?.find((att) => {
      return toISTDateString(att.date) === todayIST;
    });

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyOvertimeMinutes =
      staffData?.staffAttendances?.reduce((sum, att) => {
        const d = new Date(att.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          return sum + (att.overtimeMinutes || 0);
        }
        return sum;
      }, 0) || 0;

    setOvertime(monthlyOvertimeMinutes);

    setTodayAtt(todayAttendance);

    const recentAttendanceData =
      staffData?.staffAttendances
        ?.slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map((att) => ({
          date: formatDate(att.date),
          in: formatTime(att.actualInTime),
          out: att.actualOutTime ? formatTime(att.actualOutTime) : "-",
          late: att.isLate ? "Yes" : "No",
          overtime: `${att.overtimeMinutes || 0} mins`,
          pay: `₹${att.overtimePay || 0}`,
        })) || [];

    setRecentAttendance(recentAttendanceData);
  }, [staffData]);

  const monlist = [
    "January",
    "Feburary",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <>
      <div className="h-screen bg-white m-2 rounded flex flex-col overflow-hidden">
        <div className="px-5 py-2 flex justify-between shrink-0">
          <h1 className="font-bold text-2xl">Welcome 👋</h1>
        </div>

        <div className="w-full xl:w-[98%] flex-1 mx-auto flex flex-col gap-4 overflow-auto xl:overflow-hidden px-1">
          {/* <div className="flex flex-col xl:grid xl:grid-cols-4 gap-3 w-full [&>div]:rounded overflow-auto [&>div]:shadow-lg grid-rows-1 h-[20vh] [&>div]:flex [&>div]:flex-col [&>div]:justify-center [&>div]:items-center [&>div>h1]:text-2xl [&>div>h1]:font-semibold [&>div>h1]:uppercase [&>div>p]:text-lg [&>div>p]:font-medium [&>div>p]:text-gray-600 [&>div>h1]:text-gray-800 [&>div]:border "> */}
          <div className="flex flex-col xl:grid xl:grid-cols-4 gap-3 w-full [&>div]:rounded [&>div]:shadow-lg xl:grid-rows-1 xl:h-[20vh] [&>div]:flex [&>div]:flex-col [&>div]:justify-center [&>div]:items-center xl:[&>div>h1]:text-2xl [&>div>h1]:font-semibold [&>div>h1]:uppercase xl:[&>div>p]:text-lg [&>div>p]:font-medium [&>div>p]:text-gray-600 [&>div>h1]:text-gray-800 [&>div]:border">
            <div className="bg-gray-200 w-full h-full  ">
              <h1>Date Of Joined</h1>
              <p>{formatDate(staffData?.createdAt)}</p>
            </div>

            <div className="bg-gray-200 w-full h-full  ">
              <h1>InTime</h1>
              <p>{formatTime(staffData?.shiftStartTime)}</p>
            </div>

            <div className="bg-gray-200 w-full h-full  ">
              <h1>OutTime</h1>
              <p>{formatTime(staffData?.shiftEndTime)}</p>
            </div>

            <div className="bg-gray-200 w-full h-full  ">
              <h1>Today OverTime Pay</h1>
              <p>₹{todayAtt?.overtimePay || 0}</p>
            </div>
          </div>

          {/* <div className="flex flex-col xl:grid xl:grid-cols-4 gap-3 w-full [&>div]:rounded [&>div]:shadow-lg grid-rows-1 h-[20vh] [&>div]:flex [&>div]:flex-col [&>div]:justify-center [&>div]:items-center [&>div>h1]:text-2xl [&>div>h1]:font-semibold [&>div>h1]:uppercase [&>div>p]:text-lg [&>div>p]:font-medium [&>div>p]:text-gray-600 [&>div>h1]:text-gray-800 [&>div]:border "> */}
          <div className="flex flex-col xl:grid xl:grid-cols-4 gap-3 w-full [&>div]:rounded [&>div]:shadow-lg xl:grid-rows-1 xl:h-[20vh] [&>div]:flex [&>div]:flex-col [&>div]:justify-center [&>div]:items-center xl:[&>div>h1]:text-2xl [&>div>h1]:font-semibold [&>div>h1]:uppercase xl:[&>div>p]:text-lg [&>div>p]:font-medium [&>div>p]:text-gray-600 [&>div>h1]:text-gray-800 [&>div]:border">
            <div className="bg-gray-200 w-full h-full  ">
              <h1>Days Present</h1>
              <p>{staffData?.staffAttendances?.length || 0}</p>
            </div>

            {/* <div className="bg-gray-200 w-full h-full  ">
              <h1>Days Absent</h1>
              <p>2</p>
            </div> */}

            <div className="bg-gray-200 w-full h-full  ">
              <h1>Late Days</h1>
              <p>
                {staffData?.staffAttendances?.filter((att) => att.isLate)
                  .length || 0}
              </p>
            </div>

            <div className="bg-gray-200 w-full h-full  ">
              <h1>OverTime(This month)</h1>
              <p>
                {overtime > 60
                  ? `${(overtime / 60).toFixed(2)}Hrs`
                  : `${overtime}min`}{" "}
              </p>
            </div>

            <div className="bg-gray-200 w-full h-full  ">
              <h1>Branch</h1>
              <p>{staffData.branch?.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 [&>div]:border ">
            <div className="w-full h-[30vh] xl:h-[40vh] bg-gray-100 rounded m-1 shadow-lg p-2 overflow-hidden ">
              <h1 className="text-xl font-semibold">Recent Attendance</h1>
              <div className="w-full h-full overflow-auto [&>ul]:grid [&>ul]:grid-cols-[100px_180px_260px_220px_140px_140px_150px] xl:[&>ul]:grid-cols-6 flex flex-col [&>ul]:gap-10  mt-5 [&>ul]:text-center ">
                <ul className="font-bold mb-5">
                  {recentAtt.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                {recentAttendance.map((item, i) => {
                  return (
                    <ul key={i} className="xl:bg-[#ffffff] my-1 rounded p-1">
                      <li className="">{item.date}</li>
                      <li>{item.in}</li>
                      <li>{item.out}</li>
                      <li>{item.late}</li>
                      <li>{item.overtime}</li>
                      <li>{item.pay}</li>
                    </ul>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 

            <div className="w-[50vw] h-[50vh] bg-gray-100 rounded m-1 shadow-lg overflow-hidden p-2">
              <h1 className="text-xl font-semibold">
                Lecture History (Last 5 Lectures)
              </h1>
              <div className="w-full h-full  [&>ul]:grid [&>ul]:grid-cols-6 flex flex-col [&>ul]:gap-10  mt-5 [&>ul]:text-center ">
                <ul className="font-bold mb-5 [&>li]:font-semibold">
                  {lecturehistory.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                {lectureHistory.map((item, i) => (
                  <ul className="bg-[#ffffff] my-1 rounded p-1">
                    <li className="">{item.date}</li>
                    <li>{item.subject}</li>
                    <li>{item.planned}</li>
                    <li>{item.actual}</li>
                    <li>{item.status}</li>
                    <li>{item.penalty}</li>
                  </ul>
                ))}
              </div>
            </div>
          </div>
          <div className="w-[98%] ml-1 p-2 rounded border bg-gray-100 [&>h1]:text-xl flex [&>h1]:px-2 [&>h1]:border-r-2 [&>h1]:border-gray-300  ">
                <h1 className="border-r-0!">Penalty -{">"}</h1>
                <h1 className="" >Late: 1</h1>
                <h1 className="" >Early: 2</h1>
                <h1 className="border-r-0!" >Both: 0</h1>

          </div> */}
        </div>
      </div>
    </>
  );
};

export default StaffMain;
