"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import ActionButton from "../superAdmin/ActionButton";
import { useManagement } from "@/context/ManagementContext";

const Faculty = () => {
  const [openFaculty, setOpenFaculty] = useState(null);

  const getPenaltyCount = (user) => {
    const counts = {
      LATE_START: 0,
      EARLY_END: 0,
      BOTH: 0,
      TOTAL: 0,
    };

    user.lectures.forEach((lec) => {
      if (!Array.isArray(lec.attendance)) return;

      lec.attendance.forEach((att) => {
        if (!att.penalty || att.penalty === "NONE") return;

        counts[att.penalty]++;
        counts.TOTAL++;
      });
    });

    return counts;
  };

  const lists = [
    "Id",
    "Faculty Name",
    "Phone No.",
    "Total Lectures",
    "Lectures Done",
    "Remaining",
    "Penalty Count",
    "Details ",
  ];

  const [users, setUsers] = useState([]);

  const { fetchUser } = useManagement();
  const [penalty, setPenalty] = useState(null);

  const getLectureAttendanceStats = (lectures) => {
    console.log(lectures)
    let totalScheduled = 0;
    let conducted = 0;

    // ✅ Nested grouping by Batch+Subject
    const batchMap = {};

    lectures.forEach((lec) => {
      const subjectName = lec?.subject?.name;
      const batchName = lec?.batch?.name;
      const courseName = lec?.batch?.course?.name;

      const key = `${courseName}-${batchName}-${subjectName}`;

      if (!batchMap[key]) {
        batchMap[key] = {
          course: courseName,
          batch: batchName,
          subject: subjectName,
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

  useEffect(() => {
    const loaddata = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const branchId = user.data.user.branchId;

      const userDate = await fetchUser();

      const filterData = userDate
        .filter((user) => user.role === "FACULTY" && user.isActive)
        .filter((user) =>
          user.facultyBranches.some(
            (item) => item.branchId === Number(branchId),
          ),
        );
        console.log(filterData)

      setUsers(filterData);
    };

    loaddata();
  }, []);

  return (
    <div className="h-[91%] bg-white m-2 rounded-xl border border-stone-200 shadow-sm p-4 py-6 flex flex-wrap gap-5 flex-col items-center ">
      <div className="w-full h-full overflow-auto xl:overflow-x-hidden ">
        <ul className="grid grid-cols-[60px_180px_220px_200px_140px_140px_120px_140px_150px] xl:grid-cols-8 px-4 py-3   font-semibold rounded-lg border border-maroon-100 bg-maroon-50 text-maroon-800 text-center">
          {lists.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>

        {users.map((user, index) => {
          const penalty = getPenaltyCount(user);
          const stats = getLectureAttendanceStats(user.lectures);
          return (
            <div key={index} className="">
              <ul
                key={index}
                className="border-b border-stone-200 text-slate-700 transition-colors grid grid-cols-[60px_180px_220px_200px_140px_140px_120px_140px_150px] xl:grid-cols-8 px-4 py-3   text-center items-center text-wrap hover:bg-maroon-50/70"
              >
                <li className="font-semibold">{index + 1}</li>
                <li className="flex items-center justify-center gap-2">
                  {user.name}
                  <div
                    className={`${user.isActive ? "" : "bg-red-500  h-2 w-2 rounded-full "}`}
                  ></div>
                </li>
                <li>{user.phoneNumber}</li>

                {/* <li>{stats.batch.join(", ")}</li> */}
                <li>{stats.totalScheduled}</li>
                <li>{stats.conducted}</li>
                <li>{stats.remaining}</li>
                <li>{penalty.TOTAL}</li>
                {/* <li>{stats.late}</li>
                  <li>{stats.early}</li>
                  <li>{stats.both}</li>
                  <li>{stats.totalPenalty}</li> */}
                <li>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setOpenFaculty(openFaculty === index ? null : index)
                    }
                  >
                    {openFaculty === index ? "Hide" : "View"}
                  </Button>
                </li>
              </ul>

              {openFaculty === index && (
                <div className="bg-gray-50 border rounded p-3 col-span-full">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2">Course</th>
                        <th className="p-2">Batch</th>
                        <th className="p-2">Subject</th>
                        <th className="p-2">Total</th>
                        <th className="p-2">Done</th>
                        <th className="p-2">Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.batches.map((b, i) => (
                        <tr key={i} className="text-center border-t">
                          <td className="p-2">{b.course}</td>
                          <td className="p-2">{b.batch}</td>
                          <td className="p-2">{b.subject}</td>
                          <td className="p-2">{b.total}</td>
                          <td className="p-2">{b.done}</td>
                          <td className="p-2">{b.total - b.done}</td>
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
    </div>
  );
};

export default Faculty;
