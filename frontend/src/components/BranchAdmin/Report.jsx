"use client";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { useManagement } from "@/context/ManagementContext";
import { Input } from "../ui/input";
import ReportModels from "./Modal/ReportModels";
import RepModal from "../superAdmin/Models/RepModal";

const Report = () => {
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("FACULTY");
  // const [branch, setBranch] = useState([]);
  const [bran, setBran] = useState({});
  const [repMo, setRepMo] = useState(false);

  const facultyReportHeaders = [
    "id",
    "Faculty Name",
    "Details",
    "Lectures Done",
    "Remaining Lectures",
  ];

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

  const [facultyReportData, setFacultyReportData] = useState([]);
  const [staffReportData, setStaffReportData] = useState([]);
  const { fetchUser, fetchBranch } = useManagement();

  useEffect(() => {
    const branch = JSON.parse(localStorage.getItem("user")).data.user.branch;
    setBran(branch);
  }, []);

  useEffect(() => {
    if (role === "FACULTY") {
      const loadData = async () => {
        const data = await fetchUser();
        let filterData = data.filter((user) => user.role === "FACULTY");
        if (bran) {
          const fdata = filterData.filter((user) =>
            user.facultyBranches?.some(
              (item) => item.branchId === Number(bran.id),
            ),
          );
          setFacultyReportData(fdata);
        } else {
          setFacultyReportData(filterData);
        }
      };
      loadData();
    }

    if (role === "STAFF") {
      const loadData = async () => {
        const data = await fetchUser();
        const filterData = data.filter((user) => user.role === "STAFF").filter((user) => user.isActive);
        if (bran) {
          const fdata = filterData.filter((user) => user.branchId === bran.id);
          setStaffReportData(fdata);
        } else {
          setStaffReportData(filterData);
        }
      };
      loadData();
    }
  }, [role, bran]);

  const staffReportHeaders = [
    "id",
    "Staff Name",
    "Days Present",
    "Late Days",
    "Total Late Minutes",
    "Total Overtime (mins)",
    "Overtime Pay (₹)",
    "Total Penalty",
  ];

  const [openFaculty, setOpenFaculty] = useState(null);

  const getLectureAttendanceStats = (lectures) => {
    let totalScheduled = 0;
    let conducted = 0;

    const batchMap = {};

    lectures.forEach((lec) => {

      const branchId = lec?.batch?.course?.branchId;
      if (bran && branchId !== Number(bran.id)) return;

      const subjectName = lec?.subject?.name;
      const batchName = lec?.batch?.name;
      const courseName = lec?.batch?.course?.name;

      const key = `${courseName}-${batchName}-${subjectName}`;

      if (!batchMap[key]) {
        batchMap[key] = {
          subject: subjectName,
          batch: batchName,
          course: courseName,
          total: lec.TotalScheduled || 0,
          done: 0,
        };
      }

      totalScheduled += lec.TotalScheduled || 0;

      lec.attendance.forEach(() => {
        batchMap[key].done += 1;
        conducted += 1;
      });
    });

    return {
      totalScheduled,
      conducted,
      remaining: totalScheduled - conducted,
      batches: Object.values(batchMap), // ✅ nested rows
    };
  };

  return (
    <>
      <div className=" rounded-xl border border-stone-200 shadow-sm h-[91%] bg-white m-2 overflow-hidden p-4">
        <div className="flex gap-4 border-b-2 pb-2">
          <p className="text-xl font-semibold">Filter: </p>
          <Select value={role} onValueChange={(v) => setRole(v)}>
            <SelectTrigger className={`w-45`}>
              <SelectValue placeholder={"Role"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`FACULTY`}>Faculty</SelectItem>
              <SelectItem value={`STAFF`}>Staff</SelectItem>
            </SelectContent>
          </Select>

          <Input value={bran.name} placeholder={`Branch`} readOnly />

          {/* <Button onClick={() => setRepMo(true)}>Generate report</Button> */}
        </div>
        {role === "STAFF" && (
          <div className="h-[92%] w-full overflow-auto xl:overflow-x-hidden">
            <ul className="grid grid-cols-[60px_180px_260px_220px_140px_140px_140px_140px] xl:grid-cols-8  px-4 py-3 xl:border border-maroon-100 bg-maroon-50 text-maroon-800 rounded-lg font-semibold text-center">
              {staffReportHeaders.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {staffReportData.map((staff, index) => {
              const stats = getStaffStats(staff.staffAttendances);
              return (
                <ul
                  onClick={() => {
                    setOpen(true);
                    setUser(staff);
                  }}
                  key={index}
                  className={`border-b border-stone-200 text-slate-700 transition-colors grid grid-cols-[60px_180px_260px_220px_140px_140px_140px_140px] xl:grid-cols-8 px-4 py-3   text-center items-center ${staff.isActive ? "bg-white" : "hover:bg-maroon-50/70 bg-gray-100"}`}
                >
                  <li className="font-semibold">{index + 1}</li>
                  <li className="flex items-center justify-center gap-2">
                    {staff.name}
                    <div
                      className={`${staff.isActive ? "" : "bg-red-500  h-2 w-2 rounded-full "}`}
                    ></div>
                  </li>
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
        )}
        {role === "FACULTY" && (
          <div className=" h-[94%] w-full overflow-auto">
            <ul className="grid grid-cols-[60px_180px_140px_140px_140px] xl:grid-cols-5  px-4 py-3   font-semibold rounded-lg border border-maroon-100 bg-maroon-50 text-maroon-800 text-center">
              {facultyReportHeaders.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {facultyReportData.map((staff, index) => {
              const stats = getLectureAttendanceStats(staff.lectures);
              return (
                <div key={index}>
                  {/* Main Faculty Row */}
                  <ul
                    onClick={() => {
                      setOpen(true);
                      setUser(staff);
                    }}
                    className="grid grid-cols-[60px_180px_140px_140px_140px]
        xl:grid-cols-5 px-4 py-3 border-b text-center items-center hover:bg-gray-50"
                  >
                    <li>{index + 1}</li>
                    <li>{staff.name}</li>

                    <li>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFaculty(openFaculty === index ? null : index);
                        }}
                      >
                        {openFaculty === index ? "Hide" : "View"}
                      </Button>
                    </li>

                    <li>{stats.conducted}</li>
                    <li>{stats.remaining}</li>
                  </ul>

                  {/* Nested Breakdown */}
                  {openFaculty === index && (
                    <div className="bg-gray-50 border rounded p-3 mx-6 mb-2">
                      <table className="w-full text-sm border">
                        <thead className="bg-gray-200">
                          <tr>
                            <th>Course</th>
                            <th>Batch</th>
                            <th>Subject</th>
                            <th>Total</th>
                            <th>Done</th>
                            <th>Remaining</th>
                          </tr>
                        </thead>

                        <tbody>
                          {stats.batches.map((b, i) => (
                            <tr key={i} className="border-t text-center">
                              <td>{b.course}</td>
                              <td>{b.batch}</td>
                              <td>{b.subject}</td>
                              <td>{b.total}</td>
                              <td>{b.done}</td>
                              <td>{b.total - b.done}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReportModels
        open={open}
        setOpen={setOpen}
        user={user}
        setUser={setUser}
        branch={bran}
      />

      {/* <RepModal open={repMo} setOpen={setRepMo} branch={bran} /> */}
    </>
  );
};

export default Report;
