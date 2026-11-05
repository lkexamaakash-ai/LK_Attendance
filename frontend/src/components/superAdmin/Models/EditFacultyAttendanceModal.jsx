import { mainRoute } from "@/components/apiroute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const EditFacultyAttendanceModal = ({ open, setOpen, attId, setUpd, upd }) => {
  const format = (iso) => {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [data, setData] = useState(null);
  const [facultyType, setFacultyType] = useState(null);
  const [status, setStatus] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [inTime, setIntime] = useState("");
  const [outTime, setOuttime] = useState("");

  const [payout, setPayout] = useState(0);
  const [penaltyPreview, setPenaltyPreview] = useState(null);

  function formatTimeInput(iso) {
    if (!iso) return "";

    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const markSalaryBasedAttendance = () => {};
  const markAttendance = () => {};

  useEffect(() => {
    let tok = JSON.parse(localStorage.getItem("user"));
    let token = tok.data.token;

    try {
      const loadData = async () => {
        const { data } = await axios.get(
          `${mainRoute}/api/attendance/${attId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const att = data.data;

        setData(att);

        setFacultyType(att.lecture.faculty.facultyType);

        setStatus(att.status);

        setStartTime(formatTimeInput(att.lecture.startTime));
        setEndTime(formatTimeInput(att.lecture.endTime));

        setIntime(formatTimeInput(att.actualStartTime));
        setOuttime(formatTimeInput(att.actualEndTime));

        setPayout(att.payout);

        setPenaltyPreview({
          totalPenaltyMin: att.penaltyMin,
        });
      };

      if (open && attId) {
        loadData();
      }
    } catch (err) {
      console.log(err.message);
    }
  }, [open, attId]);

  function calculateLectureBasedFaculty({
    plannedStart,
    plannedEnd,
    actualStart,
    actualEnd,
    lectureRate,
  }) {
    const FIFTEEN_MIN = 15 * 60 * 1000;

    let isLate = actualStart - plannedStart > FIFTEEN_MIN;
    let LateMin = (actualStart - plannedStart) / (60 * 1000);
    let isEarly = plannedEnd - actualEnd > FIFTEEN_MIN;
    let EarlyMin = (plannedEnd - actualEnd) / (60 * 1000);

    let penalty = "NONE";
    if (isLate && isEarly) penalty = "BOTH";
    else if (isLate) penalty = "LATE_START";
    else if (isEarly) penalty = "EARLY_END";

    let TotalP = LateMin + EarlyMin;

    let totalPenaltyMin = TotalP * 60 * 1000 >= FIFTEEN_MIN ? TotalP : 0;

    const workedMinutes = Math.max(
      0,
      Math.floor((actualEnd - actualStart) / (1000 * 60)),
    );

    const lectureEquivalent = workedMinutes / LECTURE_MINUTES;

    const calculatedPayout =
      lectureEquivalent <= 0.875
        ? Number((lectureEquivalent * lectureRate).toFixed(2))
        : lectureRate;

    return {
      penalty,
      workedMinutes,
      lectureEquivalent: Number(lectureEquivalent.toFixed(2)),
      calculatedPayout,
      totalPenaltyMin,
      message:
        penalty === "NONE"
          ? "On Time"
          : penalty === "LATE_START"
            ? "Late Start"
            : penalty === "EARLY_END"
              ? "Early End"
              : "Late + Early",
    };
  }

  const LECTURE_MINUTES = 120;
  function applyStatusOnPayout(calculatedPayout, status) {
    console.log("Called");

    if (status === "MISSED") return 0;
    if (status === "CANCELLED") return calculatedPayout / 2;
    return calculatedPayout; // CONDUCTED
  }

  useEffect(() => {
    if (!data?.lecture || !inTime || !outTime) return;

    const date = data.lecture.startTime.split("T")[0];

    const result = calculateLectureBasedFaculty({
      plannedStart: new Date(data.lecture.startTime),
      plannedEnd: new Date(data.lecture.endTime),
      actualStart: new Date(`${date}T${inTime}`),
      actualEnd: new Date(`${date}T${outTime}`),
      lectureRate: data.lecture.faculty.lectureRate,
    });

    setPenaltyPreview(result);

    const finalPayout = applyStatusOnPayout(result.calculatedPayout, status);

    setPayout(Math.floor(finalPayout));
  }, [inTime, outTime, status, data]);

  const updateAttendance = async () => {
    try {
      const tok = JSON.parse(localStorage.getItem("user")).data.token;
      const { data } = await axios.patch(
        `${mainRoute}/api/attendance/update/${attId}`,
        {
          status: status,
          actualStartTime: inTime,
          actualEndTime: outTime,
        },
        {
          headers: {
            Authorization: `Bearer ${tok}`,
          },
        },
      );

      if (data.success == true) {
        toast.success("Updated Successfully");
        setUpd(!upd);
        setOpen(false);
      } else {
        toast.error("Something went wrong");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      {open && (
        <div className="h-screen w-full bg-[#d8d3d382] absolute top-0 left-0 flex justify-center items-center">
          <div className="h-[80vh] p-5 xl:w-[40vw] w-[90%] bg-white shadow-2xl rounded-2xl overflow-hidden ">
            <div className="flex justify-end px-5">
              <span
                className="cursor-pointer font-bold"
                onClick={() => setOpen(false)}
              >
                x
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold mb-2">Faculty Attendance</h1>
            </div>

            <div className="flex h-[90%] flex-col gap-5 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 overflow-y-auto overflow-x-hidden">
              <div>
                <Label>Date</Label>
                <Input
                  type={"text"}
                  value={data?.date ? new Date(data.date).toDateString() : ""}
                  //   onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Branch</Label>
                <div className="">
                  {data?.lecture?.batch?.course?.branch?.name}
                </div>
              </div>

              <div className="">
                <Label>Faculty Name</Label>
                <div className="">{data?.lecture?.faculty?.name}</div>
              </div>

              {facultyType === "LECTURE_BASED" && (
                <>
                  <div>
                    <Label>Course</Label>
                    <div className="">{data?.lecture?.batch?.course?.name}</div>
                  </div>

                  <div>
                    <Label>Batch</Label>
                    <div className="">{data?.lecture?.batch?.name}</div>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <div className="">{data?.lecture?.subject?.name}</div>
                  </div>
                </>
              )}

              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v)}>
                  <SelectTrigger className={`w-full`}>
                    <SelectValue placeholder={`Status`} />
                  </SelectTrigger>
                  {facultyType === "LECTURE_BASED" ? (
                    <SelectContent>
                      <SelectItem value={`CONDUCTED`}>Conducted</SelectItem>
                      <SelectItem value={`CANCELLED`}>Cancelled</SelectItem>
                      <SelectItem value={`MISSED`}>Missed</SelectItem>
                    </SelectContent>
                  ) : (
                    <SelectContent>
                      <SelectItem value={false}>Present</SelectItem>
                      <SelectItem value={true}>On Leave</SelectItem>
                    </SelectContent>
                  )}
                </Select>
              </div>

              {/* {facultyType === "SALARY_BASED" && (
                <>
                  <div className="">
                    <Label>Lectures</Label>
                    <Select onValueChange={(v) => handleAddLect(v)}>
                      <SelectTrigger className={`w-full`}>
                        <SelectValue placeholder={`Lectures`} />
                      </SelectTrigger>
                      <SelectContent>
                        {faclec.map((item, i) => (
                          <SelectItem key={i} value={item}>
                            {`${item?.subject?.name}-${item?.batch?.course?.branch?.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 flex-wrap">
                      {lectList.map((item, index) => (
                        <div
                          key={index}
                          className="flex flex-wrap gap-2 items-center justify-center text-sm bg-[#8a2a3e] text-white p-1 rounded "
                        >
                          {`${item?.subject?.name}-${item?.batch?.name}-${item?.batch?.course?.name}-${item?.batch?.course?.branch?.name}`}
                          <div
                            onClick={() => handleDelete(item)}
                            className="text-black cursor-pointer"
                          >
                            x
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )} */}

              {(status === "CONDUCTED" || facultyType === "SALARY_BASED") && (
                <>
                  <div>
                    <Label>Planned Time</Label>
                    <Input
                      type={`text`}
                      readOnly
                      className={`uppercase`}
                      value={`${startTime} - ${endTime}`}
                    />
                  </div>
                  <div>
                    <div>
                      <Label>In Time</Label>
                      <Input
                        type={`time`}
                        value={inTime}
                        onChange={(e) => setIntime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Out Time</Label>
                      <Input
                        type={`time`}
                        value={outTime}
                        onChange={(e) => setOuttime(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              {facultyType === "LECTURE_BASED" && (
                <>
                  <div>
                    <Label>Payout</Label>
                    <Input
                      value={payout}
                      readOnly
                      placeholder={`Payout`}
                      onChange={(e) => setPayout(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Penalty</Label>
                    <Input
                      type={`text`}
                      placeholder={`Penalty`}
                      value={`${penaltyPreview?.totalPenaltyMin || 0} mins`}
                      readOnly
                    />
                  </div>
                </>
              )}

              <div className="flex-row! w-full [&>Button]:cursor-pointer">
                <Button
                  onClick={() => {
                    setOpen(false);
                  }}
                  className={`w-1/2`}
                >
                  Cancel
                </Button>
                <Button onClick={updateAttendance} className={`w-1/2`}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditFacultyAttendanceModal;
