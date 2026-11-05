"use client";
import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useManagement } from "@/context/ManagementContext";
import axios from "axios";
import { mainRoute } from "../apiroute";

const FacLecture = () => {
  const myLectureHeaders = [
    "Sno.",
    "Subject",
    "Batch",
    "Course",
    "Branch",
    "Target Lectures",
    "Completed",
    "Remaining",
    "Progress",
  ];

  const { fetchLecture, fetchSubject } = useManagement();
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");

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
  const [myLecturesData, setLectureData] = useState([]);

  useEffect(() => {
    const tok = JSON.parse(localStorage.getItem("user"));
    const id = tok.data.user.id;
    const loadData = async () => {
      const { data } = await axios.get(
        `${mainRoute}/api/lecture/lec?id=${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tok.data.token}`,
          },
        },
      );

      const filterData = data.data;
      setLectureData(filterData);
    };
    loadData();
  }, []);

  const totalConducted = myLecturesData.reduce((count, lec) => {
    if (!Array.isArray(lec.attendance)) return count;

    return (
      count + lec.attendance.filter((att) => att.status === "CONDUCTED").length
    );
  }, 0);

  const totalScheduled = myLecturesData.reduce(
    (count, lec) => count + (lec.TotalScheduled || 0),
    0,
  );

  const remainingLectures = Math.max(totalScheduled - totalConducted, 0);

  const getCompletedLectures = (item) => {
    if (!Array.isArray(item.attendance)) return 0;

    return item.attendance.filter((att) => att.status === "CONDUCTED").length;
  };

  const getRemainingLectures = (item) => {
    const completed = getCompletedLectures(item);
    const total = item.TotalScheduled || 0;

    return Math.max(total - completed, 0);
  };

  const getProgress = (item) => {
    const total = item.TotalScheduled || 0;
    const completed = getCompletedLectures(item);

    if (total === 0) return 0;

    return Math.min(Math.round((completed / total) * 100), 100);
  };

  const courses = [
    ...new Set(
      myLecturesData.map((item) => item.batch?.course?.name).filter(Boolean),
    ),
  ];

  const branches = [
    ...new Set(
      myLecturesData
        .filter((item) => {
          if (selectedCourse === "ALL") return true;

          return item.batch?.course?.name === selectedCourse;
        })
        .map((item) => item.batch?.course?.branch?.name)
        .filter(Boolean),
    ),
  ];

  const filteredLectures = myLecturesData.filter((item) => {
    const courseName = item.batch?.course?.name;
    const branchName = item.batch?.course?.branch?.name;

    if (selectedCourse !== "ALL" && courseName !== selectedCourse) {
      return false;
    }

    if (selectedBranch !== "ALL" && branchName !== selectedBranch) {
      return false;
    }

    return true;
  });

  return (
    <>
      <div className="h-full bg-white m-2 rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-auto items-center">
        {/* filter */}
        <div className="w-[98%] flex items-center justify-between p-3 border-b">
          {/* LEFT - Course & Branch */}
          <div className="flex items-center gap-3">
            {/* Course */}
            <Select
              value={selectedCourse}
              onValueChange={(value) => {
                setSelectedCourse(value);

                // Course change hone par branch reset
                setSelectedBranch("ALL");
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Course" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Courses</SelectItem>

                {courses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Branch */}
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>

                {branches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* RESET */}
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCourse("ALL");
              setSelectedBranch("ALL");
            }}
          >
            Reset
          </Button>
        </div>

        {/* Lecture List */}
        <div className="w-[98%] h-full overflow-y-auto xl:overflow-x-hidden">
          <ul className="grid grid-cols-[100px_180px_260px_220px_140px_140px_140px_140px_140px] xl:grid-cols-9 text-center border-b p-2 font-semibold">
            {myLectureHeaders.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          {filteredLectures.map((item, i) => (
            <ul
              key={i}
              className="grid grid-cols-[80px_180px_180px_180px_180px_140px_140px_140px_180px] xl:grid-cols-9 text-center border-b p-3 items-center"
            >
              <li>{i + 1}</li>

              <li>{item.subject?.name}</li>

              <li>{item.batch?.name}</li>

              <li>{item.batch?.course?.name}</li>

              <li>{item.batch?.course?.branch?.name}</li>

              <li>{item.TotalScheduled || 0}</li>

              <li>{getCompletedLectures(item)}</li>

              <li>{getRemainingLectures(item)}</li>

              <li className="flex items-center gap-2 justify-center">
                <div className="w-25 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${getProgress(item)}%`,
                    }}
                  />
                </div>

                <span className="text-sm font-medium">
                  {getProgress(item)}%
                </span>
              </li>
            </ul>
          ))}
        </div>
      </div>
    </>
  );
};

export default FacLecture;
