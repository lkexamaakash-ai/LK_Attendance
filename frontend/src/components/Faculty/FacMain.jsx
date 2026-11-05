"use client";
import StatCard from "../layout/StatCard";
import { Hourglass, Presentation, TriangleAlert, Wallet } from "lucide-react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { mainRoute } from "../apiroute";
import SalaryBasedFacultyDonut from "../chart/SalaryBasedFacultyDonut";
import FacultyAttendanceBar from "../chart/FacultyAttendanceBar";
import FacultyLectureStatusDonut from "../chart/FacultyLectureStatusDonut";
import FacultyPenaltyDonut from "../chart/FacultyPenaltyDonut";

const FacMain = () => {
  const lecturehistory = [
    "Date",
    "Subject",
    "Batch",
    "Branch",
    "Planned Time",
    "Actual Time",
    "Status",
    "Penalty",
  ];

  // const lectureHistory = [
  //   {
  //     date: "06-Jan-2025",
  //     subject: "Mathematics",
  //     planned: "10:00 – 11:00",
  //     actual: "10:05 – 11:00",
  //     status: "Conducted",
  //     penalty: "None",
  //   },
  //   {
  //     date: "05-Jan-2025",
  //     subject: "Physics",
  //     planned: "11:00 – 12:00",
  //     actual: "11:25 – 12:00",
  //     status: "Conducted",
  //     penalty: "Late Start",
  //   },
  // ];

  const [faculty, setFaculty] = useState({});
  const [staff, setStaff] = useState([]);
  const [branch, setBranch] = useState({});
  const [lecture, setLecture] = useState([]);
  const [attendances, setAttendance] = useState([]);
  const [penalty, setPenalty] = useState({});
  const [user, setUser] = useState({});

  useEffect(() => {
    let tokn = JSON.parse(localStorage.getItem("user"));
    setUser(tokn.data?.user);
    let token = tokn.data.token;
    let userId = tokn.data.user.id;
    let branchId = tokn.data.user.branch?.id;
    setBranch(tokn.data.user.branch);

    const loadData = async () => {
      const { data } = await axios.get(
        `${mainRoute}/api/users/role/dash?userId=${userId}&branchId=${branchId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const facultyData = data.data.faculty;

      const lectureData = data.data.lectures;

      setLecture(lectureData);



      setFaculty(facultyData);
    };

    loadData();
  }, []);

  useEffect(() => {
    const last5AttendedLectures = lecture
      .filter(
        (lec) => Array.isArray(lec.attendance) && lec.attendance.length > 0,
      )
      .sort(
        (a, b) =>
          new Date(b.attendance[0].actualStartTime) -
          new Date(a.attendance[0].actualStartTime),
      )
      .slice(0, 5);

    const penaltyCount = lecture.reduce(
      (acc, lec) => {
        lec.attendance?.forEach((att) => {
          if (!att.penalty || att.penalty === "NONE") return;

          acc[att.penalty] += 1;
          acc.total += 1;
        });

        return acc;
      },
      {
        LATE_START: 0,
        EARLY_END: 0,
        BOTH: 0,
        total: 0,
      },
    );

    setPenalty(penaltyCount);
    setAttendance(last5AttendedLectures);
  }, [lecture]);

  const now = new Date();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [chartData, setChartData] = useState({});

  useEffect(() => {
    let user = JSON.parse(localStorage.getItem("user"));

    let token = user.data.token;
    let userId = user.data?.user?.id;
    let facultyType = user.data?.user?.type;

    if (!userId) return;
    const facultyData = async () => {
      if (facultyType === "LECTURE_BASED") {
        const { data } = await axios.get(
          `${mainRoute}/api/attendance/faculty/${userId}/monthly-summary?month=${currentMonth + 1}&year=${currentYear}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setChartData(data.data);
      } else {
        const { data } = await axios.get(
          `${mainRoute}/api/attendance/faculty/salary-summary/${
            userId
          }?month=${currentMonth + 1}&year=${currentYear}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tok}`,
            },
          },
        );
        setChartData(data.data);
      }
    };

    facultyData();
  }, []);

  const totalScheduledThisMonth = lecture.reduce(
    (count, lec) => count + (lec.TotalScheduled || 0),
    0,
  );

  const totalConductedThisMonth = lecture.reduce((count, lec) => {
    if (!Array.isArray(lec.attendance)) {
      return count;
    }

    const conductedThisMonth = lec.attendance.filter((att) => {
      if (att.status !== "CONDUCTED") {
        return false;
      }

      if (!att.date) {
        return false;
      }

      const attendanceDate = new Date(att.date);

      return (
        attendanceDate.getMonth() === currentMonth &&
        attendanceDate.getFullYear() === currentYear
      );
    }).length;

    return count + conductedThisMonth;
  }, 0);

  const remainingThisMonth = Math.max(
    totalScheduledThisMonth - totalConductedThisMonth,
    0,
  );

  const penaltiesThisMonth = lecture.reduce((count, lec) => {
    if (!Array.isArray(lec.attendance)) {
      return count;
    }

    const monthlyPenalties = lec.attendance.filter((att) => {
      if (!att.penalty || att.penalty === "NONE") {
        return false;
      }

      if (!att.date) {
        return false;
      }

      const attendanceDate = new Date(att.date);

      return (
        attendanceDate.getMonth() === currentMonth &&
        attendanceDate.getFullYear() === currentYear
      );
    }).length;

    return count + monthlyPenalties;
  }, 0);

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
      <div className="h-full bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
        <div className="px-5 py-2 flex justify-between">
          <h1 className="font-semibold text-2xl text-maroon-800">Welcome 👋</h1>
        </div>

        <div className="w-[98%] xl:h-[92%]  mx-auto flex flex-col gap-4 overflow-auto xl:overflow-hidden">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Lectures" icon={Presentation}>
              {totalConductedThisMonth}
              <span className="block text-xs font-normal text-slate-500">
                {monlist[currentMonth]} {currentYear}
              </span>
            </StatCard>

            <StatCard label="Remaining Lecture" icon={Hourglass} tone="gold">
              {remainingThisMonth}
              <span className="block text-xs font-normal text-slate-500">
                {monlist[currentMonth]} {currentYear}
              </span>
            </StatCard>

            <StatCard label="Total Penalties" icon={TriangleAlert} tone="red">
              {penaltiesThisMonth}
              <span className="block text-xs font-normal text-slate-500">
                {monlist[currentMonth]} {currentYear}
              </span>
            </StatCard>

            <StatCard label="Salary" icon={Wallet} tone="green">
              <span className="flex items-baseline gap-1">
                ₹
                {faculty?.facultyType === "LECTURE_BASED" ? (
                  <>
                    {faculty.lectureRate}{" "}
                    <span className="text-xs font-normal text-slate-500">Per Lecture</span>
                  </>
                ) : (
                  <>
                    {faculty.salary}{" "}
                    <span className="text-xs font-normal text-slate-500">Per Month</span>
                  </>
                )}
              </span>
            </StatCard>
          </div>

          <div className="flex xl:flex-wrap flex-col xl:flex-row gap-3 [&>div]:border ">
            {/* <div className="xl:w-[30vw] h-[50vh] bg-gray-100 rounded m-1 shadow-lg overflow-hidden p-2">
              <h1 className="text-xl font-semibold">Today&apos;s Lecture</h1>
              <div className="w-full h-full  [&>ul]:grid [&>ul]:grid-cols-3 flex flex-col [&>ul]:gap-10  mt-5 [&>ul]:text-center ">
                <ul className="font-bold mb-5">
                  <li>Subject</li>
                  <li>Start Time</li>
                  <li>End Time</li>
                </ul>
                {lecture.map((item, i) => (
                  <ul key={i} className="bg-[#ffffff] my-1 rounded p-1">
                    <li className="">{item?.subject?.name}</li>
                    <li>{formatTime(item?.startTime)}</li>
                    <li>{formatTime(item?.endTime)}</li>
                  </ul>
                ))}
              </div>
            </div> */}

            <div className="xl:w-full min-h-[50vh] bg-white rounded-xl border border-stone-200 shadow-sm p-4">
              {/* <h1 className="text-xl font-semibold">
                Lecture History (Last 5 Lectures)
              </h1>
              <div
                className={`w-full h-full overflow-auto  [&>ul]:grid [&>ul]:grid-cols-[100px_180px_260px_220px_140px_140px_140px_140px]  ${faculty.facultyType === "LECTURE_BASED" ? " [&>ul]:grid [&>ul]:grid-cols-[100px_180px_260px_220px_140px_140px] xl:[&>ul]:grid-cols-8" : "[&>ul]:grid [&>ul]:grid-cols-[100px_180px_260px_220px_140px_140px_140px_140px] xl:[&>ul]:grid-cols-5"} flex flex-col [&>ul]:gap-10  mt-5 [&>ul]:text-center `}
              >
                <ul className="font-bold mb-5 [&>li]:font-semibold">
                  {(faculty.facultyType === "SALARY_BASED"
                    ? lecturehistory.filter((h) => h !== "Actual Time")
                    : lecturehistory
                  ).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                {attendances.map((item, i) => {
                  const attendance = item.attendance[0];

                  return (
                    <ul key={i} className="xl:bg-white my-1 rounded p-1">
                      <li>{formatDate(item.StartDate)}</li>
                      <li>{item.subject?.name}</li>
                      <li>{item.batch?.name}</li>
                      <li>{item.batch?.course?.branch?.name}</li>
                      <li>
                        {formatTime(item.startTime)} –{" "}
                        {formatTime(item.endTime)}
                      </li>
                      {faculty.facultyType === "LECTURE_BASED" && (
                        <li>
                          <>
                            {formatTime(attendance.actualStartTime)} –{" "}
                            {formatTime(attendance.actualEndTime)}
                          </>
                        </li>
                      )}
                      <li className="text-green-600">{attendance.status}</li>
                      <li>{attendance.penalty}</li>
                    </ul>
                  );
                })}
              </div> */}

              {user?.type === "LECTURE_BASED" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FacultyLectureStatusDonut data={chartData} />
                    <FacultyPenaltyDonut data={chartData} />
                  </div>
                  <h3 className="text-xl font-semibold mt-4 text-emerald-600">
                    Total Payout: ₹{chartData.totalPayout}
                  </h3>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SalaryBasedFacultyDonut data={chartData} />
                    <FacultyAttendanceBar data={chartData} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <p>Per Day Salary: ₹{chartData?.perDaySalary}</p>
                    <p>
                      Avg Daily Minutes:{" "}
                      {chartData.attendanceSummary?.averageDailyMinutes} mins
                    </p>
                    <p>
                      Total Working Minutes:{" "}
                      {chartData.attendanceSummary?.totalWorkingMinutes}
                    </p>
                    <p>Total Days: {chartData?.totalDays}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="w-[98%] ml-1 p-2 rounded border bg-gray-100 [&>h1]:text-xl flex [&>h1]:px-2 [&>h1]:border-r-2 [&>h1]:border-gray-300  ">
            <h1 className="border-r-0!">Penalty -{">"}</h1>
            <h1 className="">Late: {penalty.LATE_START}</h1>
            <h1 className="">Early: {penalty.EARLY_END}</h1>
            <h1 className="border-r-0!">Both: {penalty.BOTH}</h1>
          </div>
        </div>
      </div>
    </>
  );
};

export default FacMain;
