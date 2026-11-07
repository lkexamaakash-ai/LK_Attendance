import { mainRoute } from "@/components/apiroute";
import axios from "axios";
import { Delete, Edit, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DeleteModal from "./DeleteModal";

const EditAttendanceModal = dynamic(() => import("./EditAttendanceModal"));

const EditFacultyAttendanceModal = dynamic(
  () => import("./EditFacultyAttendanceModal"),
);

const AllAttendance = ({
  open,
  setOpen,
  userdata,
  mon,
  yea,
  whoe,
  branchid,
}) => {
  const [serverData, setServerData] = useState([]);
  const [typ, setTyp] = useState();
  const [myLecturesData, setMyLecturesData] = useState([]);
  const [lecData, setLecData] = useState([]);
  const [openStaffModal, setOpenStaffModal] = useState(false);
  const [openFacultyModal, setOpenFacultyModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [filteredLectures, setFilteredLectures] = useState([]);

  const [attId, setAttId] = useState("");
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  function formatTime(isoIst) {
    if (!isoIst) return "";

    const safeIso = isoIst;

    const date = new Date(safeIso);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const getStatus = (lecture) => {
    const attendance = lecture.attendance?.[0];
    const now = new Date();

    if (attendance?.actualStartTime && attendance?.actualEndTime)
      return "Conducted";

    if (!attendance && new Date(lecture.endTime) < now) return "Missed";

    return "Planned";
  };

  function mergeDateAndTime(date, time) {
    const d = new Date(date);
    const t = new Date(time);

    d.setHours(t.getHours());
    d.setMinutes(t.getMinutes());
    d.setSeconds(t.getSeconds());
    d.setMilliseconds(0);

    return d;
  }

  function calculatePenaltyMinutes(
    actualStart,
    actualEnd,
    plannedStart,
    plannedEnd,
  ) {
    if (!actualStart || !actualEnd || !plannedStart || !plannedEnd) {
      return 0;
    }
    let date = new Date();

    const actualStartTime = mergeDateAndTime(date, actualStart);
    const actualEndTime = mergeDateAndTime(date, actualEnd);

    const plannedStartTime = mergeDateAndTime(date, plannedStart);
    const plannedEndTime = mergeDateAndTime(date, plannedEnd);

    // Late start
    let lateMinutes = (actualStartTime - plannedStartTime) / (1000 * 60);

    let earlyMinutes = (plannedEndTime - actualEndTime) / (1000 * 60);

    let actual = Math.abs((actualEndTime - actualStartTime) / (1000 * 60));
    let planned = Math.abs((plannedEndTime - plannedStartTime) / (1000 * 60));

    // Handle AM/PM or timezone bug
    if (lateMinutes > 720) {
      lateMinutes -= 720; // remove 12 hr
    }

    if (earlyMinutes > 720) {
      earlyMinutes -= 720;
    }

    lateMinutes = Math.max(0, lateMinutes);
    earlyMinutes = Math.max(0, earlyMinutes);

    let totalPenaltyMin = lateMinutes + earlyMinutes;

    totalPenaltyMin = planned - actual;

    // Apply penalty only if >= 15 min
    return totalPenaltyMin >= 15 ? Math.floor(totalPenaltyMin) : 0;
  }

  const mapLecturesToUI = (lectures) => {
    console.log(lectures);
    if (whoe === "branchadmin") {
      return lectures
        .filter(
          (lec) => Array.isArray(lec.attendance) && lec.attendance.length > 0,
        )
        .filter((lec) => lec?.batch.course.branchId === Number(branchid))
        .flatMap((lec) =>
          lec.attendance.map((att) => {
            const now = new Date();
            console.log(lec.batch.course.branchId === branchid);

            let status = att?.status;
            if (status === "CONDUCTED") status = "Conducted";
            else if (status === "MISSED") status = "Pre cancelled";
            else status = "Cancelled";

            let penaltyMin = calculatePenaltyMinutes(
              att.actualStartTime,
              att.actualEndTime,
              lec.startTime,
              lec.endTime,
              att.date,
            );

            return {
              date: formatDate(att.date || lec.StartDate),
              subject: lec.subject?.name || "-",
              batch: lec.batch?.name || "-",
              plannedTime: `${formatTime(lec.startTime)} – ${formatTime(
                lec.endTime,
              )}`,
              comment: att.comment,
              actualTime:
                att.actualStartTime && att.actualEndTime
                  ? `${formatTime(att.actualStartTime)} – ${formatTime(
                      att.actualEndTime,
                    )}`
                  : "-",
              status,
              penalty: att.penalty || "NONE",
              sortTime: att.date,
              penaltyMin,
              payout: att.payout || 0,
              id: att.id,
            };
          }),
        )
        .sort((a, b) => new Date(a.sortTime) - new Date(b.sortTime));
    } else {
      return lectures
        .filter(
          (lec) => Array.isArray(lec.attendance) && lec.attendance.length > 0,
        )
        .flatMap((lec) =>
          lec.attendance.map((att) => {
            const now = new Date();

            let status = att?.status;
            if (status === "CONDUCTED") status = "Conducted";
            else if (status === "MISSED") status = "Pre cancelled";
            else status = "Cancelled";

            let penaltyMin = calculatePenaltyMinutes(
              att.actualStartTime,
              att.actualEndTime,
              lec.startTime,
              lec.endTime,
              att.date,
            );

            return {
              date: formatDate(att.date || lec.StartDate),
              subject: lec.subject?.name || "-",
              batch: lec.batch?.name || "-",
              plannedTime: `${formatTime(lec.startTime)} – ${formatTime(
                lec.endTime,
              )}`,
              comment: att.comment,
              actualTime:
                att.actualStartTime && att.actualEndTime
                  ? `${formatTime(att.actualStartTime)} – ${formatTime(
                      att.actualEndTime,
                    )}`
                  : "-",
              status,
              penalty: att.penalty || "NONE",
              sortTime: att.date,
              penaltyMin,
              payout: att.payout || 0,
              id: att.id,
            };
          }),
        )
        .sort((a, b) => new Date(a.sortTime) - new Date(b.sortTime));
    }
  };

  const myLectureHeaders = [
    "Date",
    "Subject",
    "Planned Time",
    "Actual Time",
    "Status",
    "Penalty",
    "Penalty(in Rs.)",
    "Comment",
    "Edit",
  ];

  const myLecturHeaders = [
    "Date",
    "Planned Time",
    "Total time worked",
    "Status",
  ];

  const lecHeader = [
    "Date",
    "Planned Time",
    "InTime",
    "OutTime",
    "late penalty",
    "Unworked Hours Offset",
    "overtime",
    "Status",
    "Edit",
  ];

  const [upd, setUpd] = useState(false);

  useEffect(() => {
    const tok = JSON.parse(localStorage.getItem("user"));
    const id = userdata.id;
    const type = userdata.facultyType;
    setTyp(type);
    const role = userdata.role;
    const loadData = async () => {
      try {
        if (role === "FACULTY") {
          const { data } = await axios.get(
            `${mainRoute}/api/lecture/lectureatt?id=${id}&type=${type}&month=${
              mon + 1
            }&year=${yea}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tok.data.token}`,
              },
            },
          );

          setServerData(data.data);
        } else if (role === "STAFF") {
          const { data } = await axios.get(
            `${mainRoute}/api/staffAttendance/report?staffId=${id}&month=${
              mon + 1
            }&year=${yea}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tok.data.token}`,
              },
            },
          );

          const staffData = data.data.sort(
            (a, b) => new Date(a.date) - new Date(b.date),
          );
          setServerData(staffData);
        }
      } catch (err) {
        console.log(err);
      }
    };
    loadData();
  }, [userdata, mon, yea, open, upd]);

  useEffect(() => {
    if (typ === "LECTURE_BASED") {
      const uiData = mapLecturesToUI(serverData);
      setMyLecturesData(uiData);
    } else {
      setLecData(serverData);
    }
  }, [serverData]);

  const uniqueBatches = [...new Set(myLecturesData.map((item) => item.batch))];

  useEffect(() => {
    if (!selectedBatch) {
      setFilteredLectures(myLecturesData);
      return;
    }

    const filtered = myLecturesData.filter(
      (item) => item.batch === selectedBatch,
    );

    setFilteredLectures(filtered);
  }, [selectedBatch, myLecturesData]);

  function convertMinToHours(time) {
    if (!time || time <= 0) return "0 mins";

    const hrs = Math.floor(time / 60);
    const mins = time % 60;

    if (hrs > 0 && mins > 0) {
      return `${hrs} hr ${mins} mins`;
    }

    if (hrs > 0) {
      return `${hrs} hr`;
    }

    return `${mins} mins`;
  }

  const [delOpen, setDelOpen] = useState(false);
  const [lecid, setLecId] = useState(null);

  const handleDelete = async (id) => {
    const tok = JSON.parse(localStorage.getItem("user"));

    const url =
      userdata.role === "STAFF"
        ? `${mainRoute}/api/staffAttendance/${id}`
        : `${mainRoute}/api/lecture/att/${id}`;

    try {
      const { data } = await axios.delete(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok.data.token}`,
        },
      });

      if (data.success || data.succuss) {
        toast.success("Deleted successfully");
        setUpd(!upd); // table refresh
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }

    setDelOpen(false);
  };
  return (
    <>
      {open && (
        <div className="h-screen w-full bg-maroon-900/40 backdrop-blur-[2px] absolute top-0 left-0 flex justify-center items-center">
          <div className="h-[80vh] p-5 w-[90%] xl:w-[80vw] bg-white shadow-2xl rounded-2xl border border-stone-200  ">
            <div className="flex justify-between px-5">
              <div className="">
                {userdata.role === "FACULTY" && (
                  <Select
                    value={selectedBatch}
                    onValueChange={(v) => setSelectedBatch(v)}
                  >
                    <SelectTrigger className={`w-full`}>
                      <SelectValue placeholder={`Batches`} />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueBatches.map((batch, index) => (
                        <SelectItem key={index} value={batch}>
                          {batch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <span
                className="cursor-pointer rounded-full px-2.5 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                onClick={() => {
                  setOpen(false);
                  setLecData([]);
                  setMyLecturesData([]);
                  setServerData([]);
                }}
              >
                ✕
              </span>
            </div>

            <div className="w-[98%]  h-[95%] items-center overflow-auto xl:overflow-x-hidden">
              <ul
                className={`grid sticky top-0 bg-white grid-cols-[100px_180px_260px_220px_120px_140px_140px_120px] ${
                  typ === "LECTURE_BASED"
                    ? `xl:grid-cols-9`
                    : typ === "SALARY_BASED"
                      ? `xl:grid-cols-6`
                      : `xl:grid-cols-9`
                } text-center border-b p-2 font-semibold`}
              >
                {typ === "LECTURE_BASED"
                  ? myLectureHeaders.map((item, i) => <li key={i}>{item}</li>)
                  : typ === "SALARY_BASED"
                    ? myLecturHeaders.map((item, i) => <li key={i}>{item}</li>)
                    : lecHeader.map((item, i) => <li key={i}>{item}</li>)}
              </ul>

              {filteredLectures.length > 0 &&
                filteredLectures.map((item, i) => {
                  let pen =
                    item.status === "Conducted"
                      ? userdata?.lectureRate - item?.payout
                      : 0;

                  return (
                    <ul
                      key={i}
                      className={`grid grid-cols-[100px_180px_260px_220px_120px_140px_140px_120px] ${
                        typ === "LECTURE_BASED"
                          ? `xl:grid-cols-9`
                          : typ === "SALARY_BASED"
                            ? `xl:grid-cols-5`
                            : `xl:grid-cols-10`
                      } text-center border-b p-2`}
                    >
                      <li>{item.date}</li>
                      {typ === "LECTURE_BASED" && <li>{item.subject}</li>}
                      <li>{item.plannedTime}</li>
                      <li>
                        {item.status != "Conducted" ? "-" : item.actualTime}
                      </li>
                      <li
                        className={
                          item.status === "Conducted"
                            ? "text-green-600"
                            : item.status === "Missed" || item.status === "Pre cancelled"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }
                      >
                        {item.status}
                      </li>
                      <li>
                        {item.status == "Conducted"
                          ? convertMinToHours(item.penaltyMin)
                          : "-"}
                      </li>
                      <li className={`${pen > 0 && "text-red-500"}`}>₹{pen}</li>
                      <li>{item.comment ? item.comment : "-"}</li>
                      <li className="flex justify-center gap-5">
                        <Edit
                          className="cursor-pointer"
                          onClick={() => {
                            setOpenFacultyModal(true);
                            setSelectedAttendance(item?.id);
                          }}
                        />
                        <Trash
                          className="cursor-pointer"
                          onClick={() => {
                            setDelOpen(true);
                            setLecId(item.id);
                          }}
                        />
                      </li>
                    </ul>
                  );
                })}

              {lecData.length > 0 &&
                lecData.map((item, i) => {
                  return (
                    <ul
                      key={i}
                      className={`grid grid-cols-[100px_180px_260px_220px_120px_140px_140px] ${
                        typ === "LECTURE_BASED"
                          ? `xl:grid-cols-6`
                          : typ === "SALARY_BASED"
                            ? `xl:grid-cols-4`
                            : `xl:grid-cols-9`
                      } text-center border-b p-2`}
                    >
                      <li>{formatDate(item.date)}</li>
                      <li>{`${formatTime(
                        item.faculty?.shiftStartTime || item?.shiftStartTime,
                      )}-${formatTime(item.faculty?.shiftEndTime || item?.shiftEndTime)}`}</li>
                      <li>
                        {userdata.role === "STAFF"
                          ? item?.status === "PRESENT"
                            ? formatTime(item?.inTime || item?.actualInTime)
                            : "-"
                          : !item?.isLeave
                            ? convertMinToHours(item?.workingMinutes)
                            : "-"}
                      </li>

                      {userdata.role === "STAFF" && (
                        <li>
                          {item?.status === "PRESENT"
                            ? formatTime(item?.outTime || item?.actualOutTime)
                            : "-"}
                        </li>
                      )}
                      {userdata.role === "STAFF" && (
                        <>
                          <li
                            className={`${item?.totalPenalty > 0 ? "text-red-600" : "text-black"}`}
                          >
                            ₹{item?.totalPenalty - item?.extraPenalty || 0}
                          </li>
                          <li
                            className={`${item?.totalPenalty > 0 ? "text-red-600" : "text-black"}`}
                          >
                            ₹{item?.extraPenalty || 0}
                          </li>

                          <li
                            className={`${item?.overtimePay > 0 ? "text-green-600" : "text-black"}`}
                          >
                            ₹{item?.overtimePay || 0}
                          </li>
                        </>
                      )}
                      {userdata.role === "STAFF" ? (
                        <li
                          className={
                            item.status === "ONLEAVE"
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {item.status === "ONLEAVE" ? "On Leave" : "Present"}
                        </li>
                      ) : (
                        <li
                          className={
                            !item.isLeave ? "text-green-600" : "text-red-600"
                          }
                        >
                          {item.isLeave ? "On Leave" : "Present"}
                        </li>
                      )}
                      {userdata.role === "STAFF" ? (
                        <li className="flex justify-center gap-2">
                          <Edit
                            className="cursor-pointer"
                            onClick={() => {
                              setOpenStaffModal(true);
                              setAttId(item.id);
                            }}
                          />
                          <Trash
                            className="cursor-pointer"
                            onClick={() => {
                              setDelOpen(true);
                              setLecId(item.id);
                            }}
                          />
                        </li>
                      ) : (
                        <></>
                      )}
                    </ul>
                  );
                })}
            </div>
          </div>
        </div>
      )}
      <EditAttendanceModal
        open={openStaffModal}
        setOpen={setOpenStaffModal}
        attId={attId}
        setUpd={setUpd}
        upd={upd}
        wheo={whoe}
      />
      <EditFacultyAttendanceModal
        open={openFacultyModal}
        setOpen={setOpenFacultyModal}
        attId={selectedAttendance}
        setUpd={setSelectedAttendance}
        upd={upd}
      />

      <DeleteModal
        open={delOpen}
        setOpen={setDelOpen}
        handleDelete={handleDelete}
        id={lecid}
      />
    </>
  );
};

export default AllAttendance;
