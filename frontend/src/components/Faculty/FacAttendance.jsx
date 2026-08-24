"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import axios from "axios";
import { mainRoute } from "../apiroute";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const FacAttendance = () => {
  const formatDate = (iso) => {
    if (!iso) return "-";

    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (iso) => {
    if (!iso) return "-";

    const date = new Date(iso);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const [serverdata, setServerdata] = useState([]);
  const [myLecturesData, setMyLecturesData] = useState([]);

  const [typ, setType] = useState("LECTURE_BASED");

  const [lecData, setLecData] = useState([]);

  // Store month/year as STRING because Select works with strings
  const [currentmon, setCurrentMon] = useState(String(new Date().getMonth()));

  const [currentyea, setCurrentYea] = useState(
    String(new Date().getFullYear()),
  );

  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [appliedSubject, setAppliedSubject] = useState("ALL");
  const [appliedStatus, setAppliedStatus] = useState("ALL");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const mapLecturesToUI = (lectures) => {
    if (!Array.isArray(lectures)) return [];

    return (
      lectures
        .filter(
          (lec) => Array.isArray(lec.attendance) && lec.attendance.length > 0,
        )

        // Flatten lecture -> attendance
        .flatMap((lec) =>
          lec.attendance.map((att) => {
            let status = att?.status;
            if (status === "CONDUCTED") status = "Conducted";
            else if (status === "MISSED") status = "Missed";
            else status = "Cancelled";

            return {
              date: formatDate(att.date || lec.StartDate),

              subject: lec.subject?.name || "-",

              plannedTime: `${formatTime(
                lec.startTime,
              )} – ${formatTime(lec.endTime)}`,
              comment: att.comment,
              actualTime:
                att.actualStartTime && att.actualEndTime
                  ? `${formatTime(att.actualStartTime)} – ${formatTime(
                      att.actualEndTime,
                    )}`
                  : "-",

              status,
              penalty: att.penalty || "NONE",
              penaltyMin: Number(att.penaltyMin) || 0,
              penaltyAmount:
                Number(lec?.faculty?.lectureRate - att?.payout) || 0,

              sortTime: att.date,
            };
          }),
        )
        .sort((a, b) => new Date(b.sortTime) - new Date(a.sortTime))
    );
  };

  const myLectureHeaders = [
    "Date",
    "Subject",
    "Planned Time",
    "Actual Time",
    "Status",
    "Penalty",
    "Penalty Amount",
  ];

  const lecHeader = ["Date", "Planned Time", "InTime", "OutTime", "Status"];

  useEffect(() => {
    const tok = JSON.parse(localStorage.getItem("user"));

    if (!tok?.data?.user?.id) return;

    const id = tok.data.user.id;
    const type = tok.data.user.type;

    setType(type);

    const loadData = async () => {
      try {
        const { data } = await axios.get(
          `${mainRoute}/api/lecture/lectureatt?id=${id}&type=${type}&month=${
            Number(currentmon) + 1
          }&year=${Number(currentyea)}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tok.data.token}`,
            },
          },
        );

        setServerdata(data.data || []);
      } catch (error) {
        console.error("Error fetching attendance:", error);

        setServerdata([]);
      }
    };

    loadData();
  }, [currentmon, currentyea]);

  useEffect(() => {
    if (typ === "LECTURE_BASED") {
      const uiData = mapLecturesToUI(serverdata);
      setMyLecturesData(uiData);
    } else {
      setLecData(serverdata);
    }
  }, [serverdata, typ]);

  const list = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    {
      length: currentYear - 2024 + 1,
    },
    (_, i) => 2024 + i,
  );

  const getStatusClass = (status) => {
    switch (status) {
      case "Conducted":
        return "bg-green-100 text-green-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      case "Missed":
        return "bg-red-100 text-red-700";

      case "Planned":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredAttendance = myLecturesData.filter((item) => {
    if (appliedSubject !== "ALL" && item.subject !== appliedSubject) {
      return false;
    }

    if (appliedStatus !== "ALL" && item.status !== appliedStatus) {
      return false;
    }

    if (appliedFromDate) {
      const itemDate = new Date(item.sortTime);
      const startDate = new Date(`${appliedFromDate}T00:00:00`);

      if (itemDate < startDate) {
        return false;
      }
    }

    if (appliedToDate) {
      const itemDate = new Date(item.sortTime);
      const endDate = new Date(`${appliedToDate}T23:59:59`);

      if (itemDate > endDate) {
        return false;
      }
    }

    return true;
  });

  const subjects = [
    ...new Set(myLecturesData.map((item) => item.subject).filter(Boolean)),
  ];

  const handleApplyFilters = () => {
    setAppliedSubject(selectedSubject);
    setAppliedStatus(selectedStatus);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const handleClearFilters = () => {
    setSelectedSubject("ALL");
    setSelectedStatus("ALL");
    setFromDate("");
    setToDate("");

    setAppliedSubject("ALL");
    setAppliedStatus("ALL");
    setAppliedFromDate("");
    setAppliedToDate("");
  };

  return (
    <>
      <div className="h-full bg-white m-2 rounded flex flex-col overflow-hidden items-center">
        <div className="w-full flex items-center justify-between p-3">
          {/* LEFT - Month & Year */}
          <div className="flex items-center gap-3">
            <Select value={currentmon} onValueChange={setCurrentMon}>
              <SelectTrigger className="w-32.5">
                <SelectValue placeholder="Month" />
              </SelectTrigger>

              <SelectContent>
                {list.map((item, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={currentyea} onValueChange={setCurrentYea}>
              <SelectTrigger className="w-32.5">
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

          {/* RIGHT - Other Filters + Buttons */}
          <div className="flex items-center gap-3">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Subjects</SelectItem>

                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="Conducted">Conducted</SelectItem>
                <SelectItem value="Missed">Missed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-37.5"
            />

            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-37.5"
            />

            <Button onClick={handleApplyFilters}>Apply</Button>

            <Button variant="outline" onClick={handleClearFilters}>
              Reset
            </Button>
          </div>
        </div>

        {/* =====================================================
            ATTENDANCE TABLE
        ====================================================== */}

        <div className="w-[98%] h-full items-center overflow-auto xl:overflow-x-hidden">
          {/* HEADER */}

          <ul className="grid grid-cols-[120px_180px_220px_220px_150px_150px_170px] sticky top-0 xl:grid-cols-7 text-center border-b p-3 font-semibold bg-gray-50">
            {typ === "LECTURE_BASED"
              ? myLectureHeaders.map((item, i) => <li key={i}>{item}</li>)
              : lecHeader.map((item, i) => <li key={i}>{item}</li>)}
          </ul>

          {typ === "LECTURE_BASED" ? (
            filteredAttendance.length > 0 ? (
              filteredAttendance.map((item, i) => (
                <ul
                  key={`${item.sortTime}-${i}`}
                  className="grid grid-cols-[120px_180px_220px_220px_150px_150px_170px] xl:grid-cols-7 text-center border-b p-3 items-center hover:bg-gray-50"
                >
                  {/* DATE */}

                  <li>{item.date}</li>

                  {/* SUBJECT */}

                  <li>{item.subject}</li>

                  {/* PLANNED TIME */}

                  <li>{item.plannedTime}</li>

                  {/* ACTUAL TIME */}

                  <li>{item.status === "Conducted" ? item.actualTime : "-"}</li>

                  {/* STATUS */}

                  <li>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </li>

                  {/* PENALTY */}

                  <li>{item.penalty === "NONE" ? "None" : item.penalty}</li>
                  <li>
                    {item.penalty === "NONE"
                      ? "₹0"
                      : `₹${item.penaltyAmount || 0}`}
                  </li>
                </ul>
              ))
            ) : (
              <div className="font-semibold text-2xl text-center py-10">
                No Attendance Marked
              </div>
            )
          ) : lecData.length > 0 ? (
            lecData.map((item, i) => (
              <ul
                key={i}
                className="grid grid-cols-[120px_180px_220px_220px_150px] xl:grid-cols-5 text-center border-b p-3 items-center"
              >
                <li>{formatDate(item.date)}</li>

                <li>
                  {formatTime(item.faculty?.shiftStartTime)}
                  {" - "}
                  {formatTime(item.faculty?.shiftEndTime)}
                </li>

                <li>{formatTime(item.inTime)}</li>

                <li>{formatTime(item.outTime)}</li>

                <li>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      item.isLeave
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.isLeave ? "On Leave" : "Present"}
                  </span>
                </li>
              </ul>
            ))
          ) : (
            <div className="font-semibold text-2xl text-center py-10">
              No Attendance Marked
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FacAttendance;
